import { z } from "zod";

const vehicleValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  transmission: z.string().min(1, "Model is required"),
  slug: z.string().min(1, "Slug is required"),

  serialNo: z.string().min(1, "serialNo is required").optional(),
  location: z.string().min(1, "Location is required"),
  // thumbnail: z.string().min(1, "thumbnail is required").optional(),
  year: z.number().min(1886, "Enter a valid year"),
  totalKmDriven: z.number().min(0, "KM driven must be positive"),
  price: z.number().min(0, "price must be positive"),
  fuelType: z.enum(["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "LPG"]),
  // images: z.array(z.string().url("Image must be a valid URL")).optional(),
  owners: z.enum(["1stOwner", "2ndOwner", "3rdOwner", "4thOwner"]),
});

export const validateVehicle = (data) => {
  const result = vehicleValidationSchema.safeParse(data);
  if (!result.success) {
    console.error(result.error.format());
  }
  return {
    result: result.success,
    data: result.data,
  };
};
