export const MEASUREMENT_UNITS = {
  // Volume units
  VOLUME: [
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_CMQ', label: 'CMQ', description: 'Cubic Centimetre' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_FTQ', label: 'FTQ', description: 'Cubic Foot' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_GLL', label: 'GLL', description: 'Liquid Gallon (3.78541 DM3)' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_INQ', label: 'INQ', description: 'Cubic Inch' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_LTR', label: 'LTR', description: 'Litre (1 DM3)' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_MTQ', label: 'MTQ', description: 'Cubic Metre' }
  ],

  // Weight units
  WEIGHT: [
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_KGM', label: 'KGM', description: 'Kilogram' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_LBR', label: 'LBR', description: 'Pound UK, US (0.45359237 KGM)' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_ONZ', label: 'ONZ', description: 'Ounce UK, US (28.949523 GRM)' }
  ],

  // Dimensions units
  DIMENSIONS: [
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_CMT', label: 'CMT', description: 'Centimetre' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_FOT', label: 'FOT', description: 'Foot' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_INH', label: 'INH', description: 'Inch' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_MTR', label: 'MTR', description: 'Metre' }
  ],

  // Temperature units
  TEMPERATURE: [
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_CEL', label: 'CEL', description: 'Degree Celsius' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_FAH', label: 'FAH', description: 'Degree Fahrenheit' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#MeasurementUnitCode_KEL', label: 'KEL', description: 'Kelvin' }
  ],

  // Add Currency Units
  CURRENCY: [
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_EUR', label: 'EUR', description: 'Euro' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_USD', label: 'USD', description: 'US Dollar' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_GBP', label: 'GBP', description: 'British Pound Sterling' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_JPY', label: 'JPY', description: 'Japanese Yen' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_CHF', label: 'CHF', description: 'Swiss Franc' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_AUD', label: 'AUD', description: 'Australian Dollar' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_CAD', label: 'CAD', description: 'Canadian Dollar' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_CNY', label: 'CNY', description: 'Chinese Yuan' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_HKD', label: 'HKD', description: 'Hong Kong Dollar' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_NZD', label: 'NZD', description: 'New Zealand Dollar' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_SEK', label: 'SEK', description: 'Swedish Krona' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_KRW', label: 'KRW', description: 'South Korean Won' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_SGD', label: 'SGD', description: 'Singapore Dollar' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_NOK', label: 'NOK', description: 'Norwegian Krone' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_MXN', label: 'MXN', description: 'Mexican Peso' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_INR', label: 'INR', description: 'Indian Rupee' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_BRL', label: 'BRL', description: 'Brazilian Real' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_RUB', label: 'RUB', description: 'Russian Ruble' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_ZAR', label: 'ZAR', description: 'South African Rand' },
    { id: 'https://onerecord.iata.org/ns/coreCodeLists#CurrencyCode_AED', label: 'AED', description: 'UAE Dirham' }
  ],

  // Get all units for general use
  ALL: function() {
    return [
      ...this.VOLUME,
      ...this.WEIGHT,
      ...this.DIMENSIONS,
      ...this.TEMPERATURE,
      ...this.CURRENCY
    ];
  }
};

// Helper function to get unit options based on field type
export const getUnitOptionsForField = (fieldName) => {
  if (fieldName.toLowerCase().includes('currency')) {
    return MEASUREMENT_UNITS.CURRENCY;
  } else if (fieldName.toLowerCase().includes('weight')) {
    return MEASUREMENT_UNITS.WEIGHT;
  } else if (fieldName.toLowerCase().includes('volume')) {
    return MEASUREMENT_UNITS.VOLUME;
  } else if (fieldName.toLowerCase().includes('dimension') || 
             fieldName.toLowerCase().includes('length') ||
             fieldName.toLowerCase().includes('width') ||
             fieldName.toLowerCase().includes('height')) {
    return MEASUREMENT_UNITS.DIMENSIONS;
  } else if (fieldName.toLowerCase().includes('temperature')) {
    return MEASUREMENT_UNITS.TEMPERATURE;
  }
  return MEASUREMENT_UNITS.ALL();
};

// Add a specific helper for currency fields
export const getCurrencyOptions = () => MEASUREMENT_UNITS.CURRENCY;
