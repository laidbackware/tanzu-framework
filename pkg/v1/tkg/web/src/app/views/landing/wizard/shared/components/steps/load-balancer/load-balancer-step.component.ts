// Angular imports
import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
// Third party imports
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
// App imports
import { APIClient } from "../../../../../../../swagger";
import AppServices from '../../../../../../../shared/service/appServices';
import { AviCloud } from "src/app/swagger/models/avi-cloud.model";
import { AviServiceEngineGroup } from "src/app/swagger/models/avi-service-engine-group.model";
import { AviVipNetwork } from './../../../../../../../swagger/models/avi-vip-network.model';
import { ClrLoadingState } from "@clr/angular";
import { IpFamilyEnum } from 'src/app/shared/constants/app.constants';
import { LoadBalancerField, LoadBalancerStepMapping } from './load-balancer-step.fieldmapping';
import { StepFormDirective } from "../../../step-form/step-form";
import { StepMapping } from '../../../field-mapping/FieldMapping';
import { ValidationService } from "../../../validation/validation.service";

const SupervisedFields = [
    LoadBalancerField.CONTROLLER_HOST,
    LoadBalancerField.USERNAME,
    LoadBalancerField.PASSWORD,
    LoadBalancerField.CONTROLLER_CERT
];

@Component({
    selector: 'app-load-balancer-step',
    templateUrl: './load-balancer-step.component.html',
    styleUrls: ['./load-balancer-step.component.scss']
})
export class SharedLoadBalancerStepComponent extends StepFormDirective implements OnInit {

    loadingState: ClrLoadingState = ClrLoadingState.DEFAULT;
    connected: boolean = false;
    clouds: Array<AviCloud>;
    selectedCloud: AviCloud;
    selectedCloudName: string;
    serviceEngineGroups: Array<AviServiceEngineGroup>;
    serviceEngineGroupsFiltered: Array<AviServiceEngineGroup>;
    labels: Map<string, string> = new Map<string, string>();
    vipNetworks: Array<AviVipNetwork> = [];
    selectedNetworkName: string;
    selectedManagementClusterNetworkName: string;
    loadBalancerLabel = 'Load Balancer Settings';

    private stepMapping: StepMapping;

    constructor(private validationService: ValidationService,
                private apiClient: APIClient) {
        super();
    }

    protected customizeForm() {
        SupervisedFields.forEach(field => {
            this.formGroup.get(field).valueChanges
                .pipe(
                    debounceTime(500),
                    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
                    takeUntil(this.unsubscribe)
                )
                .subscribe(() => {
                    if (this.connected) {
                        this.connected = false;
                        this.disarmField(LoadBalancerField.CLOUD_NAME, true);
                        this.clouds = [];
                        this.disarmField(LoadBalancerField.SERVICE_ENGINE_GROUP_NAME, true);
                        this.serviceEngineGroups = [];
                        this.disarmField(LoadBalancerField.NETWORK_CIDR, true);
                        this.disarmField(LoadBalancerField.MANAGEMENT_CLUSTER_NETWORK_CIDR, true);

                        // If connection cleared, toggle validators OFF
                        this.toggleValidators(false);
                    }
                });
        });

        this.formGroup.get(LoadBalancerField.CLOUD_NAME).valueChanges.pipe(
            distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
            takeUntil(this.unsubscribe)
        ).subscribe((cloud) => {
            this.selectedCloudName = cloud;
            this.onSelectCloud(this.selectedCloudName);
        });

        this.registerOnValueChange("networkName", this.onSelectVipNetwork.bind(this));
        this.registerOnValueChange("networkCIDR", this.onSelectVipCIDR.bind(this));
        this.registerOnValueChange(LoadBalancerField.MANAGEMENT_CLUSTER_NETWORK_NAME, this.onSelectManagementNetwork.bind(this));
        this.registerOnIpFamilyChange(LoadBalancerField.NETWORK_CIDR, [], []);
        this.registerOnIpFamilyChange(LoadBalancerField.MANAGEMENT_CLUSTER_NETWORK_CIDR, [
            this.validationService.isValidIpNetworkSegment()], [
            this.validationService.isValidIpv6NetworkSegment()
        ]);
    }

    private supplyStepMapping(): StepMapping {
        if (!this.stepMapping) {
            this.stepMapping = this.createStepMapping();
        }
        return this.stepMapping;
    }

    private createStepMapping(): StepMapping {
        const result = LoadBalancerStepMapping;
        const managementClusterNetworkNameMapping = AppServices.fieldMapUtilities.getFieldMapping('managementClusterNetworkName', result);
        const managementClusterNetworkCidrMapping = AppServices.fieldMapUtilities.getFieldMapping('managementClusterNetworkCIDR', result);
        if (this.modeClusterStandalone) {
            managementClusterNetworkNameMapping.label = 'STANDALONE CLUSTER VIP NETWORK NAME';
            managementClusterNetworkCidrMapping.label = 'STANDALONE CLUSTER VIP NETWORK CIDR';
        }
        const clusterFieldMapping = AppServices.fieldMapUtilities.getFieldMapping(LoadBalancerField.CLUSTER_LABELS, result);
        clusterFieldMapping.retriever = this.getClusterLabels.bind(this);
        clusterFieldMapping.restorer = this.setClusterLabels.bind(this);
        return result;
    }

    ngOnInit() {
        super.ngOnInit();
        AppServices.userDataFormService.buildForm(this.formGroup, this.wizardName, this.formName, this.supplyStepMapping());
        this.htmlFieldLabels = AppServices.fieldMapUtilities.getFieldLabelMap(this.supplyStepMapping());
        this.storeDefaultLabels(this.supplyStepMapping());
        this.registerDefaultFileImportedHandler(this.eventFileImported, this.supplyStepMapping());
        this.registerDefaultFileImportErrorHandler(this.eventFileImportError);

        this.customizeForm();
    }

    private setClusterLabels(data: Map<string, string>)  {
        return this.labels = data;
    }

    private getClusterLabels(): Map<string, string> {
        return this.labels;
    }

    /**
     * @method connectLB
     * helper method to make connection to AVI LB controller, call getClouds and
     * getSvcEngineGroups methods if AVI LB controller connection successful
     */
    connectLB() {
        this.loadingState = ClrLoadingState.LOADING;

        this.apiClient.verifyAccount({
            credentials: {
                username: this.formGroup.controls[LoadBalancerField.USERNAME].value,
                password: this.formGroup.controls[LoadBalancerField.PASSWORD].value,
                host: this.formGroup.controls[LoadBalancerField.CONTROLLER_HOST].value,
                tenant: this.formGroup.controls[LoadBalancerField.USERNAME].value,
                CAData: this.formGroup.controls[LoadBalancerField.CONTROLLER_CERT].value
            }
        })
            .pipe(
                finalize(() => this.loadingState = ClrLoadingState.DEFAULT),
                takeUntil(this.unsubscribe))
            .subscribe(
                ((res) => {
                    this.errorNotification = '';
                    this.connected = true;

                    this.getClouds();
                    this.getServiceEngineGroups();
                    this.getVipNetworks();

                    // If connection successful, toggle validators ON
                    this.toggleValidators(true);
                }),
                ((err) => {
                    const error = err.error.message || err.message || JSON.stringify(err);
                    if (error.indexOf('Invalid credentials') >= 0) {
                        this.errorNotification = `Invalid credentials: check your username and password`;
                    } else if (error.indexOf('Rest request error, returning to caller') >= 0) {
                        this.errorNotification = `Invalid Controller Certificate Authority: check the validity of the certificate`;
                    } else {
                        this.errorNotification = `Failed to connect to the specified Avi load balancer controller. ${error}`;
                    }
                })
            );
    }

    /**
     * @method getClouds
     * helper method calls API to get list of clouds
     */
    getClouds() {
        this.apiClient.getAviClouds()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(
                ((res) => {
                    this.errorNotification = '';
                    this.clouds = res;
                }),
                ((err) => {
                    const error = err.error.message || err.message || JSON.stringify(err);
                    this.errorNotification =
                        `Failed to retrieve Avi load balancer clouds list. ${error}`;
                })
            );
    }

    /**
     * @method getServiceEngineGroups
     * helper method calls API to get list of service engine groups
     */
    getServiceEngineGroups() {
        this.apiClient.getAviServiceEngineGroups()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(
                ((res) => {
                    this.errorNotification = '';
                    this.serviceEngineGroups = res;
                    // refreshes service engine group list which may not have been loaded at time of cloud selection
                    this.onSelectCloud(this.selectedCloudName);
                }),
                ((err) => {
                    const error = err.error.message || err.message || JSON.stringify(err);
                    this.errorNotification =
                        `Failed to retrieve Avi load balancer service engine groups list. ${error}`;
                })
            );
    }

    /**
     * @method getServiceEngineGroups
     * helper method calls API to get list of service engine groups
     */
    getVipNetworks() {
        this.apiClient.getAviVipNetworks()
            .pipe(takeUntil(this.unsubscribe))
            .subscribe(
                ((res) => {
                    this.errorNotification = '';
                    this.vipNetworks = res;
                }),
                ((err) => {
                    const error = err.error.message || err.message || JSON.stringify(err);
                    this.errorNotification =
                        `Failed to retrieve Avi VIP networks. ${error}`;
                })
            );
    }

    /**
     * @method onSelectCloud
     * @param cloudName - name of selected cloud
     * helper method sets selected cloud object based on cloud 'name' returned from dropdown; then
     * filters list of service engine groups where the cloud uuid matches in 'location'
     */
    onSelectCloud(cloudName: string) {
        this.serviceEngineGroupsFiltered = [];

        if (cloudName && this.clouds) {
            this.selectedCloud = this.clouds.find((cloud: AviCloud) => { return cloud.name === cloudName; });
            if (this.selectedCloud) {
                this.serviceEngineGroupsFiltered = this.serviceEngineGroups.filter((group: AviServiceEngineGroup) => {
                    return group.location.includes(this.selectedCloud.uuid);
                });
            }
        }
    }

    /**
     * Return all the configured subnets for the selected vip network.
     */
    onSelectVipNetwork(networkName: string): void {
        this.selectedNetworkName = networkName;
        if (!this.formGroup.get(LoadBalancerField.MANAGEMENT_CLUSTER_NETWORK_NAME).value) { }
        this.formGroup.get(LoadBalancerField.MANAGEMENT_CLUSTER_NETWORK_NAME).setValue(networkName)
    }

    onSelectVipCIDR(cidr: string): void {
        if (!this.formGroup.get(LoadBalancerField.MANAGEMENT_CLUSTER_NETWORK_CIDR).value) {
                this.formGroup.get(LoadBalancerField.MANAGEMENT_CLUSTER_NETWORK_CIDR).setValue(cidr);
        }
    }

    onSelectManagementNetwork(networkName: string): void {
        this.selectedManagementClusterNetworkName = networkName;
    }

    /**
     * @method toggleValidators
     * @param validate - boolean if true activates all fields and sets their validators; if false
     * disarms fields and clears validators
     */
    toggleValidators(validate: boolean) {
        if (validate === true) {
            this.resurrectField(LoadBalancerField.CLOUD_NAME, [Validators.required],
                this.getStoredValue(LoadBalancerField.CLOUD_NAME, this.supplyStepMapping(), ''));
            this.resurrectField(LoadBalancerField.SERVICE_ENGINE_GROUP_NAME, [Validators.required],
                this.getStoredValue(LoadBalancerField.SERVICE_ENGINE_GROUP_NAME, this.supplyStepMapping(), ''));
            if (!this.modeClusterStandalone) {
                this.resurrectField(LoadBalancerField.NETWORK_NAME, [Validators.required],
                    this.getStoredValue(LoadBalancerField.NETWORK_NAME, this.supplyStepMapping(), ''));
                this.resurrectField(LoadBalancerField.NETWORK_CIDR, [
                    Validators.required,
                    this.validationService.noWhitespaceOnEnds(),
                    this.ipFamily === IpFamilyEnum.IPv4 ?
                        this.validationService.isValidIpNetworkSegment() : this.validationService.isValidIpv6NetworkSegment()
                ], this.getStoredValue(LoadBalancerField.NETWORK_CIDR, this.supplyStepMapping(), ''));
            }
        } else {
            this.disarmField(LoadBalancerField.CLOUD_NAME, true);
            this.disarmField(LoadBalancerField.SERVICE_ENGINE_GROUP_NAME, true);
            if (!this.modeClusterStandalone) {
                this.disarmField(LoadBalancerField.NETWORK_NAME, true);
                this.disarmField(LoadBalancerField.NETWORK_CIDR, true);
            }
        }
    }

    /**
     * @method getDisabled
     * helper method to get if connect btn should be disabled
     */
    getDisabled(): boolean {
        return (
            SupervisedFields.some(f => !this.formGroup.get(f).value) ||
                SupervisedFields.some(f => !this.formGroup.get(f).valid)
        )
    }

    /**
     * Add workload cluster label'
     */
    addLabel(key: string, value: string) {
        if (key === '' || value === '') {
            this.errorNotification = `Key and value for Labels are required.`;
        } else if (!this.labels.has(key)) {
            this.labels.set(key, value);
            this.formGroup.controls[LoadBalancerField.NEW_LABEL_KEY].setValue('');
            this.formGroup.controls[LoadBalancerField.NEW_LABEL_VALUE].setValue('');
        } else {
            this.errorNotification = `A Label with the same key already exists.`;
        }
    }

    /**
     * Delete workload cluster label'
     */
    deleteLabel(key: string) {
        this.labels.delete(key);
    }

    /**
     * @method getLabelDisabled
     * helper method to get if label add btn should be disabled
     */
    getLabelDisabled(): boolean {
        return !(this.formGroup.get(LoadBalancerField.NEW_LABEL_KEY).valid &&
            this.formGroup.get(LoadBalancerField.NEW_LABEL_VALUE).valid);
    }

    /**
     * This is to make sense that the list returned is always up to date.
     */
    get vipNetworksPerCloud() {
        if (this.vipNetworks && this.vipNetworks.length > 0 && this.selectedCloud) {
            return this.vipNetworks.filter(net => net.cloud === this.selectedCloud.uuid);
        }
        return [];
    }

    getSubnets(networkName: string): any[] {
        if (!this.isEmptyArray(this.vipNetworksPerCloud) && networkName) {
            const temp = this.vipNetworksPerCloud
                .find(net => net.name === networkName);

            if (temp && !this.isEmptyArray(temp.configedSubnets)) {
                return temp.configedSubnets
                    .filter(subnet => subnet.family === "V4");      // Only V4 are supported in Calgary 1.
            }
        }
        return [];
    }
    /**
     * This is to make sense that the list returned is always up to date.
     */
    get subnetsPerNetwork() {
        return this.getSubnets(this.selectedNetworkName);
    }

    /**
     * This is to make sense that the list returned is always up to date.
     */
    get subnetsPerManagementNetwork() {
        return this.getSubnets(this.selectedManagementClusterNetworkName);
    }

    protected storeUserData() {
        this.storeUserDataFromMapping(this.supplyStepMapping());
        this.storeDefaultDisplayOrder(this.supplyStepMapping());
    }
}
