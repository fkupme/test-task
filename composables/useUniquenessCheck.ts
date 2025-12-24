import { ref, reactive } from "vue";
import { useNuxtApp } from "nuxt/app";
import { AuthService } from "~/classes/api/AuthService";

export function useUniquenessCheck() {
  const isChecking = ref(false);
  const uniqueStatus = reactive<{ email: boolean | null; phone: boolean | null}>(
    { email: null, phone: null },
  );
  const fieldsValidForCheck = reactive<{ email: boolean; phone: boolean }>(
    { email: false, phone: false },
  );

  function resetEmailStatus() {
    uniqueStatus.email = null;
  }
  function resetPhoneStatus() {
    uniqueStatus.phone = null;
  }

  async function checkEmailUniqueness(email: string): Promise<boolean> {
    isChecking.value = true;
    try {
      const nuxtApp = useNuxtApp();
      const apiGateway = (nuxtApp.$apiGateway as any) || undefined;
      const authService = new AuthService(apiGateway as any);
      const result = await authService.isEmailUnique(email);
      uniqueStatus.email = !!result;
      return !!result;
    } finally {
      isChecking.value = false;
    }
  }

  async function checkPhoneUniqueness(phoneNumber: string, countryCode: string): Promise<boolean> {
    isChecking.value = true;
    try {
      const nuxtApp = useNuxtApp();
      const apiGateway = (nuxtApp.$apiGateway as any) || undefined;
      const authService = new AuthService(apiGateway as any);
      const result = await authService.isPhoneUnique(phoneNumber, countryCode);
      uniqueStatus.phone = !!result;
      return !!result;
    } finally {
      isChecking.value = false;
    }
  }

  return {
    isChecking,
    uniqueStatus,
    fieldsValidForCheck,
    resetEmailStatus,
    resetPhoneStatus,
    checkEmailUniqueness,
    checkPhoneUniqueness,
  };
} 