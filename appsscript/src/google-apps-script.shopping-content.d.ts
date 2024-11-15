/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Potential contribution to:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/google-apps-script
 */
declare namespace GoogleAppsScript {
  export namespace ShoppingContent {
    interface ShoppingContent {
      Products: Products;
    }
    interface Products {
      list(
        merchantId: string,
        optionalArgs?: {
          pageToken?: string;
          maxResults?: number;
        }
      ): ProductsListResponse;
    }
    interface ProductsListResponse {
      nextPageToken: string;
      kind: string;
      resources: Product[];
    }
    interface Product {
      id: string;
      offerId: string;
      title: string;
      description: string;
      link: string;
      imageLink: string;
      additionalImageLinks: string[];
      lifestyleImageLinks: string[];
      contentLanguage: string;
      targetCountry: string;
      feedLabel: string;
      channel: string;
      expirationDate: string;
      disclosureDate: string;
      adult: boolean;
      kind: string;
      brand: string;
      color: string;
      googleProductCategory: string;
      gtin: string;
      itemGroupId: string;
      material: string;
      mpn: string;
      pattern: string;
      price: Price;
      salePrice: Price;
      salePriceEffectiveDate: string;
      productHeight: ProductDimension;
      productLength: ProductDimension;
      productWidth: ProductDimension;
      productWeight: ProductWeight;
      shipping: ProductShipping[];
      freeShippingThreshold: FreeShippingThreshold[];
      shippingWeight: ProductShippingWeight;
      sizes: string[];
      taxes: ProductTax[];
      customAttributes: CustomAttribute[];
      identifierExists: boolean;
      installment: Installment;
      loyaltyProgram: LoyaltyProgram;
      loyaltyPrograms: LoyaltyProgram[];
      multipack: string;
      customLabel0: string;
      customLabel1: string;
      customLabel2: string;
      customLabel3: string;
      customLabel4: string;
      isBundle: boolean;
      mobileLink: string;
      availabilityDate: string;
      shippingLabel: string;
      unitPricingMeasure: ProductUnitPricingMeasure;
      unitPricingBaseMeasure: ProductUnitPricingBaseMeasure;
      shippingLength: ProductShippingDimension;
      shippingWidth: ProductShippingDimension;
      shippingHeight: ProductShippingDimension;
      displayAdsId: string;
      displayAdsSimilarIds: string[];
      displayAdsTitle: string;
      displayAdsLink: string;
      displayAdsValue: number;
      sellOnGoogleQuantity: string;
      promotionIds: string[];
      maxHandlingTime: string;
      minHandlingTime: string;
      costOfGoodsSold: Price;
      autoPricingMinPrice: Price;
      source: string;
      includedDestinations: string[];
      excludedDestinations: string[];
      adsGrouping: string;
      adsLabels: string[];
      adsRedirect: string;
      productTypes: string[];
      ageGroup: string;
      availability: string;
      condition: string;
      gender: string;
      sizeSystem: string;
      sizeType: string;
      additionalSizeType: string;
      energyEfficiencyClass: string;
      minEnergyEfficiencyClass: string;
      maxEnergyEfficiencyClass: string;
      taxCategory: string;
      transitTimeLabel: string;
      shoppingAdsExcludedCountries: string[];
      pickupMethod: string;
      pickupSla: string;
      linkTemplate: string;
      mobileLinkTemplate: string;
      productDetails: ProductProductDetail[];
      productHighlights: string[];
      subscriptionCost: ProductSubscriptionCost;
      canonicalLink: string;
      externalSellerId: string;
      pause: string;
      virtualModelLink: string;
      cloudExportAdditionalProperties: CloudExportAdditionalProperties[];
      certifications: ProductCertification[];
      structuredTitle: ProductStructuredTitle;
      structuredDescription: ProductStructuredDescription;
    }
  }
  interface Price {
    value: string;
    currency: string;
  }
  interface ProductDimension {
    value: number;
    unit: string;
  }
  interface ProductWeight {
    value: number;
    unit: string;
  }
  interface ProductShipping {
    price: Price;
    country: string;
    region: string;
    service: string;
    locationId: string;
    locationGroupName: string;
    postalCode: string;
    minHandlingTime: string;
    maxHandlingTime: string;
    minTransitTime: string;
    maxTransitTime: string;
  }
  interface FreeShippingThreshold {
    country: string;
    priceThreshold: Price;
  }
  interface ProductShippingWeight {
    value: number;
    unit: string;
  }
  interface ProductTax {
    rate: number;
    country: string;
    region: string;
    taxShip: boolean;
    locationId: string;
    postalCode: string;
  }
  interface CustomAttribute {
    name: string;
    value: string;
    groupValues: CustomAttribute[];
  }
  interface Installment {
    months: string;
    amount: Price;
    downpayment: Price;
    creditType: string;
  }
  interface LoyaltyProgram {
    programLabel: string;
    tierLabel: string;
    price: Price;
    cashbackForFutureUse: Price;
    loyaltyPoints: string;
    memberPriceEffectiveDate: string;
  }
  interface ProductUnitPricingMeasure {
    value: number;
    unit: string;
  }
  interface ProductUnitPricingBaseMeasure {
    value: string;
    unit: string;
  }
  interface ProductShippingDimension {
    value: number;
    unit: string;
  }
  interface ProductProductDetail {
    sectionName: string;
    attributeName: string;
    attributeValue: string;
  }
  interface ProductSubscriptionCost {
    period: string;
    periodLength: string;
    amount: Price;
  }
  interface CloudExportAdditionalProperties {
    propertyName: string;
    textValue: string[];
    boolValue: boolean;
    intValue: string[];
    floatValue: number[];
    minValue: number;
    maxValue: number;
    unitCode: string;
  }
  interface ProductCertification {
    certificationAuthority: string;
    certificationName: string;
    certificationCode: string;
    certificationValue: string;
  }
  interface ProductStructuredTitle {
    digitalSourceType: string;
    content: string;
  }
  interface ProductStructuredDescription {
    digitalSourceType: string;
    content: string;
  }
}

declare let ShoppingContent: GoogleAppsScript.ShoppingContent.ShoppingContent;
