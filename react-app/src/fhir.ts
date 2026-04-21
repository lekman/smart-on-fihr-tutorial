import type Client from 'fhirclient/lib/Client'
import { Sentry } from './sentry'

export type PatientSummary = {
  firstName: string
  lastName: string
  gender: string
  birthDate: string
  height?: string
  systolicBP?: string
  diastolicBP?: string
  hdl?: string
  ldl?: string
}

// FHIR HumanName.family is string[] in DSTU2 and string in STU3/R4.
// HumanName.given stays string[]. Handle both to avoid the .join crash the
// original tutorial had against R4 data.
const nameToString = (part: unknown): string => {
  if (Array.isArray(part)) return part.filter(Boolean).join(' ')
  if (typeof part === 'string') return part
  return ''
}

const formatQuantity = (
  o: { valueQuantity?: { value?: number; unit?: string } } | undefined,
): string | undefined => {
  const value = o?.valueQuantity?.value
  const unit = o?.valueQuantity?.unit
  if (value === undefined || unit === undefined) return undefined
  return `${value} ${unit}`
}

// Blood pressure comes back as a panel (LOINC 55284-4) with component entries
// for systolic (8480-6) and diastolic (8462-4). Pick the right component.
const extractBP = (
  panels: Array<{ component?: Array<{ code?: { coding?: Array<{ code?: string }> }; valueQuantity?: { value?: number; unit?: string } }> }>,
  componentCode: string,
): string | undefined => {
  for (const panel of panels) {
    const match = panel.component?.find((c) =>
      c.code?.coding?.some((coding) => coding.code === componentCode),
    )
    if (match?.valueQuantity) {
      return formatQuantity({ valueQuantity: match.valueQuantity })
    }
  }
  return undefined
}

export async function loadPatientSummary(client: Client): Promise<PatientSummary> {
  Sentry.addBreadcrumb({ category: 'fhir', message: 'loadPatientSummary started' })

  if (!client.patient?.id) {
    const err = new Error('No patient in SMART launch context')
    Sentry.captureException(err)
    throw err
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [patient, observations] = await Promise.all<any>([
    client.patient.read(),
    client.patient.request(
      `Observation?code=${[
        'http://loinc.org|8302-2',
        'http://loinc.org|8462-4',
        'http://loinc.org|8480-6',
        'http://loinc.org|2085-9',
        'http://loinc.org|2089-1',
        'http://loinc.org|55284-4',
      ].join(',')}`,
      { pageLimit: 0, flat: true },
    ),
  ])

  Sentry.addBreadcrumb({
    category: 'fhir',
    message: 'patient + observations resolved',
    data: {
      patientId: patient?.id,
      observationCount: Array.isArray(observations) ? observations.length : 0,
    },
  })

  const nameEntry = patient?.name?.[0]
  const firstName = nameToString(nameEntry?.given)
  const lastName = nameToString(nameEntry?.family)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obsByCode = (code: string): any[] =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (observations as any[]).filter((o) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      o?.code?.coding?.some((c: any) => c?.code === code),
    )

  const height = obsByCode('8302-2')[0]
  const bpPanels = obsByCode('55284-4')
  const hdl = obsByCode('2085-9')[0]
  const ldl = obsByCode('2089-1')[0]

  const summary: PatientSummary = {
    firstName,
    lastName,
    gender: patient?.gender ?? '',
    birthDate: patient?.birthDate ?? '',
    height: formatQuantity(height),
    systolicBP: extractBP(bpPanels, '8480-6'),
    diastolicBP: extractBP(bpPanels, '8462-4'),
    hdl: formatQuantity(hdl),
    ldl: formatQuantity(ldl),
  }

  Sentry.logger.info('Patient summary assembled', {
    patientId: patient?.id,
    hasHeight: !!summary.height,
    hasSystolicBP: !!summary.systolicBP,
    hasDiastolicBP: !!summary.diastolicBP,
    hasHdl: !!summary.hdl,
    hasLdl: !!summary.ldl,
  })

  return summary
}
