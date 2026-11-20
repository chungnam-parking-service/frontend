import { describe, expect, it } from 'vitest';
import { createHttpParkingApi } from '../src/services/parkingApi';

const baseUrl = process.env.BACKEND_TEST_URL;
// 쓰기 검사는 폐기 가능한 로컬 검증 DB에서만 명시적으로 실행한다.
describe.skipIf(!baseUrl || process.env.BACKEND_WRITE_TESTS !== '1')('실제 제보 API 계약', () => {
  const api = createHttpParkingApi({ baseUrl: baseUrl ?? '' });
  it('사진 없는 제보를 검토 대기로 접수한다', async () => {
    const result = await api.sendReport('place-demo-cafe', {
      lotId: 'lot-demo-public',
      comment: '자동 계약 테스트용 제보',
    });
    expect(result).toMatchObject({
      status: 'pending',
      placeId: 'place-demo-cafe',
      lotId: 'lot-demo-public',
      photoUrl: null,
    });
  });
  it('사진 포함 multipart를 접수하고 사진을 조회할 수 있다', async () => {
    const png = Uint8Array.from(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jgZwAAAAASUVORK5CYII=',
        'base64',
      ),
    );
    const photo = new File([png], 'test-entrance.png', { type: 'image/png' });
    const result = await api.sendReport('place-demo-cafe', { lotId: 'lot-demo-public' }, photo);
    expect(result.status).toBe('pending');
    expect(result.photoUrl).toBeTruthy();
    const response = await fetch(result.photoUrl!);
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(png);
  });
});
