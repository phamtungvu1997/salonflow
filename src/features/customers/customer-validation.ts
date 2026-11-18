import { CustomerGender } from "@/features/customers/customer-types";

export type CustomerFormDraft = {
  firstName: string;
  lastName: string;
  gender: CustomerGender;
  birthDate: string;
  email: string;
  phone: string;
  phoneLandline: string;
  postalCode: string;
  houseNumber: string;
  addressLine: string;
  city: string;
  labels: string[];
  additionalInfo: string;
  invoiceInfo: string;
  appointmentWarning: string;
};

export type CustomerValidationResult =
  | {
      valid: true;
      firstName: string;
      lastName: string;
      displayName: string;
    }
  | {
      valid: false;
      missingFirstName: boolean;
      missingLastName: boolean;
      message: string;
    };

export function validateCustomerFormDraft(draft: {
  firstName: string;
  lastName: string;
}): CustomerValidationResult {
  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  if (!firstName || !lastName) {
    return {
      valid: false,
      missingFirstName: !firstName,
      missingLastName: !lastName,
      message: "Vorname und Nachname sind erforderlich.",
    };
  }
  return {
    valid: true,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`.trim(),
  };
}

export function buildCustomerMutationPayload(
  salonId: string,
  draft: CustomerFormDraft,
) {
  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  return {
    salonId,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`.trim(),
    gender: draft.gender,
    birthDate: draft.birthDate.trim() || "",
    email: draft.email.trim() || "",
    phone: draft.phone.trim() || "",
    phoneLandline: draft.phoneLandline.trim() || "",
    postalCode: draft.postalCode.trim() || "",
    houseNumber: draft.houseNumber.trim() || "",
    addressLine: draft.addressLine.trim() || "",
    city: draft.city.trim() || "",
    labels: draft.labels,
    additionalInfo: draft.additionalInfo.trim() || "",
    invoiceInfo: draft.invoiceInfo.trim() || "",
    appointmentWarning: draft.appointmentWarning.trim() || "",
  };
}
