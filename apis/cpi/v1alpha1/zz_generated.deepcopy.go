//go:build !ignore_autogenerated
// +build !ignore_autogenerated

// Copyright 2022 VMware, Inc. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Code generated by controller-gen. DO NOT EDIT.

package v1alpha1

import (
	v1 "k8s.io/api/core/v1"
	runtime "k8s.io/apimachinery/pkg/runtime"
)

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *CPIConfig) DeepCopyInto(out *CPIConfig) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
	out.Status = in.Status
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new CPIConfig.
func (in *CPIConfig) DeepCopy() *CPIConfig {
	if in == nil {
		return nil
	}
	out := new(CPIConfig)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *CPIConfig) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *CPIConfigList) DeepCopyInto(out *CPIConfigList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]CPIConfig, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new CPIConfigList.
func (in *CPIConfigList) DeepCopy() *CPIConfigList {
	if in == nil {
		return nil
	}
	out := new(CPIConfigList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *CPIConfigList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *CPIConfigSpec) DeepCopyInto(out *CPIConfigSpec) {
	*out = *in
	in.VSphereCPI.DeepCopyInto(&out.VSphereCPI)
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new CPIConfigSpec.
func (in *CPIConfigSpec) DeepCopy() *CPIConfigSpec {
	if in == nil {
		return nil
	}
	out := new(CPIConfigSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *CPIConfigStatus) DeepCopyInto(out *CPIConfigStatus) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new CPIConfigStatus.
func (in *CPIConfigStatus) DeepCopy() *CPIConfigStatus {
	if in == nil {
		return nil
	}
	out := new(CPIConfigStatus)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *NSXT) DeepCopyInto(out *NSXT) {
	*out = *in
	if in.Routes != nil {
		in, out := &in.Routes, &out.Routes
		*out = new(NSXTRoute)
		**out = **in
	}
	if in.NSXTCredentialsRef != nil {
		in, out := &in.NSXTCredentialsRef, &out.NSXTCredentialsRef
		*out = new(v1.SecretReference)
		**out = **in
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new NSXT.
func (in *NSXT) DeepCopy() *NSXT {
	if in == nil {
		return nil
	}
	out := new(NSXT)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *NSXTRoute) DeepCopyInto(out *NSXTRoute) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new NSXTRoute.
func (in *NSXTRoute) DeepCopy() *NSXTRoute {
	if in == nil {
		return nil
	}
	out := new(NSXTRoute)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *NonParavirtualConfig) DeepCopyInto(out *NonParavirtualConfig) {
	*out = *in
	if in.VSphereCredentialRef != nil {
		in, out := &in.VSphereCredentialRef, &out.VSphereCredentialRef
		*out = new(v1.SecretReference)
		**out = **in
	}
	if in.NSXT != nil {
		in, out := &in.NSXT, &out.NSXT
		*out = new(NSXT)
		(*in).DeepCopyInto(*out)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new NonParavirtualConfig.
func (in *NonParavirtualConfig) DeepCopy() *NonParavirtualConfig {
	if in == nil {
		return nil
	}
	out := new(NonParavirtualConfig)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ParavirtualConfig) DeepCopyInto(out *ParavirtualConfig) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ParavirtualConfig.
func (in *ParavirtualConfig) DeepCopy() *ParavirtualConfig {
	if in == nil {
		return nil
	}
	out := new(ParavirtualConfig)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *VSphereCPI) DeepCopyInto(out *VSphereCPI) {
	*out = *in
	if in.NonParavirtualConfig != nil {
		in, out := &in.NonParavirtualConfig, &out.NonParavirtualConfig
		*out = new(NonParavirtualConfig)
		(*in).DeepCopyInto(*out)
	}
	if in.ParavirtualConfig != nil {
		in, out := &in.ParavirtualConfig, &out.ParavirtualConfig
		*out = new(ParavirtualConfig)
		**out = **in
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new VSphereCPI.
func (in *VSphereCPI) DeepCopy() *VSphereCPI {
	if in == nil {
		return nil
	}
	out := new(VSphereCPI)
	in.DeepCopyInto(out)
	return out
}