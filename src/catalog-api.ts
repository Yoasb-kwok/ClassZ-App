import { apiRequest, assetUrl } from "./api"
import type { Centre, CentreMember, Program } from "./flow-application"

type ApiCourse = {
  id: number
  center_id: number | null
  name: string
  program_code: string | null
  intro?: string | null
  category: string | null
  location: string | null
  venue: string | null
  price: number | string | null
  instructor?: string | null
  language?: string | null
  age_tag?: string | null
  image_url?: string | null
  course_type?: string | null
}

type ApiCentreMember = {
  id: number
  name: string
  role: string
  photo_url?: string | null
}

type ApiCentre = {
  id: number
  center_name: string
  district: string | null
  category: string | null
  address: string | null
  description?: string | null
  banner_url?: string | null
  avatar_url?: string | null
  features: string[]
  members?: ApiCentreMember[]
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

function mapMember(member: ApiCentreMember): CentreMember {
  return {
    id: String(member.id),
    name: member.name,
    role: member.role,
    photoUrl: assetUrl(member.photo_url),
  }
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
    venue: course.venue || "",
    price: Number(course.price) || 0,
    rating: 0,
    intro: course.intro || "",
    instructor: course.instructor || "",
    language: course.language || "",
    ageTag: course.age_tag || "",
    imageUrl: assetUrl(course.image_url),
    courseType: course.course_type || "",
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
        description: centre.description || "",
        priceFrom: prices.length ? Math.min(...prices) : 0,
        rating: 0,
        reviewCount: 0,
        supportsSen: (centre.features || []).some((feature) => /sen/i.test(feature)),
        imageIndex: index,
        imageUrl: assetUrl(centre.banner_url || centre.avatar_url),
        features: centre.features || [],
        members: (centre.members || []).map(mapMember),
      }
    }),
  }
}
