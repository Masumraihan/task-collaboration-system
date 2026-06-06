// utils/getCountryFromIP.ts
import geoip from "geoip-lite";
import countries from "i18n-iso-countries";

// Register locale for country names
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

export interface CountryInfo {
  countryCode: string | null;
  countryName: string | null;
}

export const getCountryFromIP = (ip: string): CountryInfo => {
  const geo = geoip.lookup(ip);

  if (!geo || !geo.country) {
    return {
      countryCode: null,
      countryName: null,
    };
  }

  const countryCode = geo.country;
  const countryName = countries.getName(countryCode, "en") || null;

  return {
    countryCode,
    countryName,
  };
};
