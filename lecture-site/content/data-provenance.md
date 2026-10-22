# 공공데이터 출처와 재현 기록

## 교육용 도서관 스냅샷

- 파일: `public/data/libraries.json`
- 원본: [전국도서관표준데이터](https://www.data.go.kr/data/15013109/standard.do)
- 제공기관: 경기도 용인시. 전국 자료는 지방자치단체·교육청 제공분을 병합합니다.
- 추출 조건: `CTPRVN_NM == "경기도"` 및 `SIGNGU_NM == "용인시"`.
- 추출 결과: 전국 3,597개 기록 중 용인시 27개 기록. 이 숫자는 이번 다운로드 결과이며 전체 지역 도서관의 완전한 현황을 보장하지 않습니다.
- 원본 행의 데이터기준일자: 27개 모두 `2024-11-20`.
- 수집 시각: 2026-10-22T13:58:54+00:00
- 다운로드 응답 SHA-256: `f7657cc40f7ef84e5708b0d02aaae3ffe1ab1a4876385115fcd733c6f3911469`.
- 기관 파일 등록정보에는 2026-10-06 수정이 표시되었지만, 전국 병합본의 행별 기준일은 2024-11-20입니다. 수집일·파일 수정일·행별 기준일은 서로 다른 개념입니다.

## 이용 조건 확인

전국 표준 페이지에 연결된 경기도_용인시_도서관의 제공기관 상세정보에서 무료 및 **이용허락범위 제한 없음**을 확인했습니다. 제공기관 상세 ID는 `uddi:79e0637e-133e-4527-b8e5-a78089a4aac3`입니다. 확인 경로는 표준 페이지의 데이터 목록에서 기관명 `용인`을 검색한 뒤 해당 파일의 상세정보를 여는 절차입니다.

포털이 제공하는 상세정보 조회 요청은 `POST https://www.data.go.kr/tcs/dss/selectDpkDetailInfo.do`, 본문은 `publicDataDetailPk=uddi:79e0637e-133e-4527-b8e5-a78089a4aac3`입니다. 이는 별도 API 계약이 보장된 주소가 아니라 포털 화면의 조회 경로이므로 서비스 런타임에 의존하지 않습니다.

[공공데이터포털 이용정책](https://www.data.go.kr/ugs/selectPortalPolicyView.do)을 함께 확인했습니다. 기관 설명문·사진·지도 타일을 가져오지 않았으며, 시설명·주소·운영시각 등 제공된 구조화 필드만 추출했습니다. 원본 값을 정정하거나 추정하지 않았고, 위도·경도와 열람좌석수만 숫자 자료형으로 변환했습니다. `fields` 메타데이터에 영문 원본 필드와 화면용 필드의 대응을 보관했습니다.

## 다운로드 재현

2026-10-22 현재 포털의 `std-download-manager.js`가 사용하는 공개 파일 다운로드 경로를 읽어 아래 요청을 검증했습니다. 로그인·API 인증키 없이 성공했습니다. 아래 경로는 포털 화면 구현에 종속되므로 향후 바뀔 수 있습니다. 사용자가 자료를 새로 받으려면 원본 상세 페이지의 파일 다운로드가 기본 경로입니다.

```python
import json
import urllib.parse
import urllib.request

base = "https://www.data.go.kr"
header_url = base + "/download/columList.json?pk=15013109&ext=JSON"
with urllib.request.urlopen(header_url) as response:
    header = json.load(response)
params = {
    "publicDataPk": "15013109",
    "colNmList": header["tableVO"]["colNmList"],
    "totalCount": header["totalCount"],
    "svcTableNm": header["tableVO"]["svcTableNm"],
    "perPage": 10000,
    "page": 1,
}
url = base + "/download/standard.json?" + urllib.parse.urlencode(params, doseq=True)
with urllib.request.urlopen(url) as response:
    rows = json.load(response)
yongin = [row for row in rows
          if row.get("CTPRVN_NM") == "경기도" and row.get("SIGNGU_NM") == "용인시"]
```

실제 요청 URL은 `libraries.json`의 `metadata.downloadUrl`에 보관했습니다. 홈페이지는 저장된 JSON 스냅샷만 읽고 포털의 내부 다운로드 경로를 호출하지 않습니다.

## 데모의 의미와 한계

이 데이터는 생성형 AI가 만든 가상 시설이 아닌 공식 공개 데이터 추출본입니다. 가상 사용자의 목표와 행동은 별도의 모킹 시나리오이며 실제 사용자 관찰로 혼동하지 않습니다. 운영시간·휴관일·좌석수는 현재 운영이나 실시간 빈자리 정보가 아닙니다. 방문 판단은 [용인시 도서관 공식 홈페이지](https://lib.yongin.go.kr/)에서 다시 확인해야 합니다.

이번 데모는 검색·조건 변경·빈 결과·기준일 표시·출처 확인의 사용자 흐름을 실습하기 위한 것입니다. 일자별 실제 개관 여부 또는 장애인 접근성 등 원본에 없거나 해석이 필요한 정보를 추정하여 표시하지 않습니다.

## 데이터 아이디어 카탈로그

`content/data-catalog.json`의 8개 항목은 공식 상세 페이지를 2026-10-22에 확인했습니다. 아이디어와 긍정적 효과는 강의용 제안이며 원본 기관의 제품 추천이나 실증 결과가 아닙니다. 갱신주기·이용 조건은 각 데이터셋마다 다르므로 모두 같은 조건이라고 일반화하지 않습니다.

특히 공중화장실 데이터는 위도·경도 제공 중단 안내가 있고, 에어코리아 대기오염정보는 공공누리 제3유형(출처표시·변경금지)이며, 기상청 단기예보는 제1유형(출처표시)입니다. API 예시는 인증키 발급·활용신청을 하지 않았습니다. 파일 다운로드와 API 이용신청을 구분해서 설명합니다.
