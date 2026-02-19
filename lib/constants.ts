export const siteAssetsBucketName = "site-assets"

export const exhibitionCategories = [
  "solo-exhibitions",
  "group-exhibitions",
] as const

export type ExhibitionCategory = (typeof exhibitionCategories)[number]

export const worksYearRangeStart = 2018
export const worksYearRangeEnd = 2021
export const worksYearRangeValue = `${worksYearRangeStart}-${worksYearRangeEnd}`
export const worksYearRangeDisplay = `${worksYearRangeStart} - ${worksYearRangeEnd}`
