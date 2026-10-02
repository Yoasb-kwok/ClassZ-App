import { apiRequest } from "./api"
import type { Centre, Program } from "./flow-application"

type ApiCourse = {
  id: number
  center_id: number | null
  name: string
  program_code: string | null
  category: string | null
  location: string | null
  venue: string | null
  price: number | string | null
}

type ApiCentre = {
  id: number
  center_name: string
  district: string | null
  category: string | null
  address: string | null
  features: string[]
}

const CATEGORY_LABELS: Record<string, string> = {
  music: "Music",
  stem: "STEM",
  art: "Art",
  sports: "Sports",
  academic: "Academic",
}

function categoryLabel(raw: string | null | undefined): string {
  return CATEGORY_LABELS[String(raw || "").trim().toLowerCase()] || "Others"
}

export async function fetchCatalog(): Promise<{ programs: Program[]; centres: Centre[] }> {
  const [{ data: courses }, { data: centres }] = await Promise.all([
    apiRequest<{ data: ApiCourse[] }>("/courses"),
    apiRequest<{ data: ApiCentre[] }>("/centers"),
  ])

  const programs: Program[] = courses.map((course) => ({
    id: String(course.id),
    centreId: course.center_id != null ? String(course.center_id) : undefined,
    programCode: course.program_code || undefined,
    title: course.name,
    category: categoryLabel(course.category),
    location: course.venue || course.location || "",
    price: Number(course.price) || 0,
    rating: 0,
  }))

  return {
    programs,
    centres: centres.map((centre, index) => {
      const id = String(centre.id)
      const own = programs.filter((program) => program.centreId === id)
      const categories = Array.from(new Set([
        ...(centre.category ? [categoryLabel(centre.category)] : []),
        ...own.map((program) => program.category),
      ]))
      const prices = own.map((program) => program.price).filter((price) => price > 0)
      return {
        id,
        name: centre.center_name,
        categories: categories.length ? categories : ["Others"],
        location: centre.district || "",
        address: centre.address || "",
        priceFrom: prices.length ? Math.min(...prices) : 0,
        rating: 0,
        reviewCount: 0,
        supportsSen: (centre.features || []).includes("sen"),
        imageIndex: index,
      }
    }),
  }
}
