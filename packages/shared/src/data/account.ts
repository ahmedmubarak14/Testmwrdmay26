// Account management: members, roles, addresses, approval nodes.

import { v4 as uuid } from "uuid";

import type {
  Address,
  ApprovalNode,
  CompanyMember,
  CompanyRole,
  ID,
  User,
} from "../types";
import {
  CreateAddressSchema,
  InviteCompanyMemberSchema,
  SetDirectApproverSchema,
} from "../validations";
import { detectCycle } from "../utils/approval-chain";
import { generateClientAlias, generateSupplierAlias } from "../utils/aliases";
import { store, nowISO } from "./store";

// ─── Members & roles ────────────────────────────────────────────────────────

export async function listCompanyMembers(company_id: ID): Promise<CompanyMember[]> {
  return Array.from(store.company_members.values()).filter(
    (m) => m.company_id === company_id,
  );
}

export async function inviteCompanyMember(input: {
  company_id: ID;
  email: string;
  real_name: string;
  phone: string;
  company_role_id: ID;
}): Promise<{ user: User; member: CompanyMember }> {
  const parsed = InviteCompanyMemberSchema.parse(input);
  const company = store.companies.get(parsed.company_id);
  if (!company) throw new Error("Company not found");

  const userId = uuid();
  const platform_alias =
    company.type === "client"
      ? generateClientAlias()
      : generateSupplierAlias(
          Array.from(store.companies.values())
            .filter((c) => c.type === "supplier")
            .map((c) => c.platform_alias),
        );

  const user: User = {
    id: userId,
    email: parsed.email,
    role: company.type, // 'client' or 'supplier'
    real_name: parsed.real_name,
    phone: parsed.phone,
    platform_alias,
    company_id: parsed.company_id,
    status: "pending_callback",
    activation_status: "awaiting_callback",
    callback_notes: null,
    activation_token: null,
    language: "en",
    onboarding_completed: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  store.users.set(userId, user);

  const member: CompanyMember = {
    id: uuid(),
    company_id: parsed.company_id,
    user_id: userId,
    company_role_id: parsed.company_role_id,
  };
  store.company_members.set(member.id, member);

  return { user, member };
}

export async function listCompanyRoles(company_id: ID): Promise<CompanyRole[]> {
  return Array.from(store.company_roles.values()).filter(
    (r) => r.company_id === company_id,
  );
}

export async function createCompanyRole(input: {
  company_id: ID;
  name: string;
  permissions: string[];
}): Promise<CompanyRole> {
  const role: CompanyRole = { id: uuid(), ...input };
  store.company_roles.set(role.id, role);
  return role;
}

export async function assignRoleToMember(
  member_id: ID,
  company_role_id: ID,
): Promise<CompanyMember> {
  const member = store.company_members.get(member_id);
  if (!member) throw new Error("Member not found");
  const updated: CompanyMember = { ...member, company_role_id };
  store.company_members.set(member_id, updated);
  return updated;
}

// ─── Approval nodes ─────────────────────────────────────────────────────────

export async function listApprovalNodes(company_id: ID): Promise<ApprovalNode[]> {
  return Array.from(store.approval_nodes.values()).filter(
    (n) => n.company_id === company_id,
  );
}

export async function setDirectApprover(input: {
  company_id: ID;
  member_user_id: ID;
  direct_approver_user_id: ID | null;
}): Promise<ApprovalNode> {
  const parsed = SetDirectApproverSchema.parse(input);

  if (parsed.direct_approver_user_id !== null) {
    const existing = Array.from(store.approval_nodes.values()).filter(
      (n) => n.company_id === parsed.company_id,
    );
    // Build a hypothetical view including the proposed change.
    const hypothetical = existing.filter(
      (n) => n.member_user_id !== parsed.member_user_id,
    );
    hypothetical.push({
      id: "tmp",
      company_id: parsed.company_id,
      member_user_id: parsed.member_user_id,
      direct_approver_user_id: parsed.direct_approver_user_id,
    });
    if (
      detectCycle(
        hypothetical,
        parsed.member_user_id,
        parsed.direct_approver_user_id,
      )
    ) {
      throw new Error("Approval cycle detected — change rejected");
    }
  }

  const existingNode = Array.from(store.approval_nodes.values()).find(
    (n) =>
      n.company_id === parsed.company_id &&
      n.member_user_id === parsed.member_user_id,
  );

  if (existingNode) {
    const updated: ApprovalNode = {
      ...existingNode,
      direct_approver_user_id: parsed.direct_approver_user_id,
    };
    store.approval_nodes.set(existingNode.id, updated);
    return updated;
  }

  const fresh: ApprovalNode = {
    id: uuid(),
    company_id: parsed.company_id,
    member_user_id: parsed.member_user_id,
    direct_approver_user_id: parsed.direct_approver_user_id,
  };
  store.approval_nodes.set(fresh.id, fresh);
  return fresh;
}

// ─── Addresses ──────────────────────────────────────────────────────────────

export async function listAddresses(company_id: ID): Promise<Address[]> {
  return Array.from(store.addresses.values()).filter(
    (a) => a.company_id === company_id,
  );
}

export async function createAddress(input: {
  company_id: ID;
  type: "delivery" | "billing";
  label: string;
  national_address_code: string;
  address_code: string;
  full_address: string;
  phone: string;
  is_default?: boolean;
}): Promise<Address> {
  const parsed = CreateAddressSchema.parse(input);
  const id = uuid();
  const addr: Address = { id, ...parsed };
  store.addresses.set(id, addr);
  return addr;
}

export async function updateAddress(
  id: ID,
  patch: Partial<Omit<Address, "id">>,
): Promise<Address> {
  const existing = store.addresses.get(id);
  if (!existing) throw new Error("Address not found");
  const updated: Address = { ...existing, ...patch };
  store.addresses.set(id, updated);
  return updated;
}

export async function deleteAddress(id: ID): Promise<void> {
  store.addresses.delete(id);
}
