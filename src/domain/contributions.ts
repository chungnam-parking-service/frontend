import { z } from 'zod';

export const feedbackInputSchema = z.object({
  accurate: z.boolean(),
  comment: z.string().trim().max(300).optional(),
});
export const reportInputSchema = z
  .object({
    lotId: z.string().min(1).max(100).optional(),
    entranceGuide: z.string().trim().max(500).optional(),
    feeDescription: z.string().trim().max(300).optional(),
    hoursDescription: z.string().trim().max(300).optional(),
    benefitDescription: z.string().trim().max(300).optional(),
    validationInstructions: z.string().trim().max(500).optional(),
    walkingSteps: z.array(z.string().trim().min(1).max(300)).max(10).optional(),
    entranceLatitude: z.number().finite().min(33).max(39).optional(),
    entranceLongitude: z.number().finite().min(124).max(132).optional(),
    comment: z.string().trim().max(1000).optional(),
  })
  .refine(
    (value) => (value.entranceLatitude === undefined) === (value.entranceLongitude === undefined),
    '입구 위도와 경도를 함께 입력해 주세요.',
  );
const receiptFields = {
  id: z.number().int().positive(),
  placeId: z.string(),
  createdAt: z.string().datetime({ offset: true }),
};
export const feedbackReceiptSchema = z.object({
  ...receiptFields,
  lotId: z.string(),
  accurate: z.boolean(),
});
export const reportReceiptSchema = z.object({
  ...receiptFields,
  status: z.literal('pending'),
  lotId: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
});
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
export type ReportInput = z.infer<typeof reportInputSchema>;
export type ReportReceipt = z.infer<typeof reportReceiptSchema>;
export interface ContributionApi {
  sendFeedback(
    placeId: string,
    lotId: string,
    input: FeedbackInput,
    signal?: AbortSignal,
  ): Promise<z.infer<typeof feedbackReceiptSchema>>;
  sendReport(
    placeId: string,
    input: ReportInput,
    photo?: File,
    signal?: AbortSignal,
  ): Promise<ReportReceipt>;
}
export function validateReport(input: ReportInput, photo?: File) {
  const parsed = reportInputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue.path[0] === 'walkingSteps')
      throw new Error('도보 안내는 최대 10단계, 한 단계에 300자 이내로 입력해 주세요.');
    if (issue.path[0] === 'entranceLatitude' || issue.path[0] === 'entranceLongitude')
      throw new Error('입구 위도는 33–39, 경도는 124–132 범위로 입력해 주세요.');
    throw new Error(
      issue.code === 'custom' ? issue.message : '입력한 내용의 길이와 형식을 확인해 주세요.',
    );
  }
  if (photo) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type))
      throw new Error('JPG, PNG, WebP 사진만 첨부할 수 있어요.');
    if (photo.size > 5 * 1024 * 1024) throw new Error('사진은 5MB 이하로 첨부해 주세요.');
  }
  const meaningful = Object.entries(parsed.data).some(
    ([key, value]) =>
      key !== 'lotId' &&
      (typeof value === 'number' ||
        (Array.isArray(value) ? value.length > 0 : Boolean(value?.trim()))),
  );
  if (!meaningful && !photo) throw new Error('수정할 정보나 사진을 하나 이상 입력해 주세요.');
  return parsed.data;
}
