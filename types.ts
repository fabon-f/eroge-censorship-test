import { is, PredicateType } from "unknownutil";

export const isBrand = is.ObjectOf({
  name: is.String,
  url: is.String,
});

export type Brand = PredicateType<typeof isBrand>;

export const isBrands = is.ArrayOf(isBrand);

export type Brands = PredicateType<typeof isBrands>;
