# 공공데이터 출처와 재현 기록

## 교육용 도서관 스냅샷

- 파일: `public/data/libraries.json`
- 원본: [전국도서관표준데이터](https://www.data.go.kr/data/15013109/standard.do)
- 제공기관: 경기도 용인시. 전국 자료는 지방자치단체·교육청 제공분을 병합합니다.
- 추출 조건: `CTPRVN_NM == "경기도"` 및 `SIGNGU_NM == "용인시"`.
- 추출 결과: 이번 다운로드의 전국 3,597개 기록 중 용인시 27개 기록입니다.
- 원본 행의 데이터기준일자: 27개 모두 `2024-11-20`.
- 수집 시각: 2026-10-22T13:58:54+00:00
- 다운로드 응답 SHA-256: `f7657cc40f7ef84e5708b0d02aaae3ffe1ab1a4876385115fcd733c6f3911469`.
- 기관 파일 수정 표시는 2026-10-06이고, 전국 병합본의 행별 기준일은 2024-11-20입니다. 수집일·파일 수정일·행별 기준일은 서로 다른 개념입니다.

## 이용 조건 확인

전국 표준 페이지에 연결된 경기도_용인시_도서관의 제공기관 상세정보에서 무료 및 **이용허락범위 제한 없음**을 확인했습니다. 제공기관 상세 ID는 `uddi:79e0637e-133e-4527-b8e5-a78089a4aac3`입니다. 확인 경로는 표준 페이지의 데이터 목록에서 기관명 `용인`을 검색한 뒤 해당 파일의 상세정보를 여는 절차입니다.

포털이 제공하는 상세정보 조회 요청은 `POST https://www.data.go.kr/tcs/dss/selectDpkDetailInfo.do`, 본문은 `publicDataDetailPk=uddi:79e0637e-133e-4527-b8e5-a78089a4aac3`입니다. 이 주소는 자료 확인에 사용한 포털 화면의 조회 경로입니다. 서비스에서는 저장된 JSON 스냅샷을 사용합니다.

[공공데이터포털 이용정책](https://www.data.go.kr/ugs/selectPortalPolicyView.do)을 함께 확인했습니다. 추출 범위는 시설명·주소·운영시각 등 제공된 구조화 필드입니다. 원본 값을 보존하고 위도·경도와 열람좌석수를 숫자 자료형으로 변환했습니다. `fields` 메타데이터에 영문 원본 필드와 화면용 필드의 대응을 보관했습니다.

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

실제 요청 URL은 `libraries.json`의 `metadata.downloadUrl`에 보관했습니다. 홈페이지의 데이터 읽기 경로는 저장된 JSON 스냅샷입니다.

## 데모 데이터와 확인 범위

자료 성격: 공식 공개 데이터 추출본입니다. 가상 사용자의 목표와 행동은 강의용 모킹 시나리오로 표시하고, 실제 사람의 사용 관찰은 별도로 기록합니다. 운영시간·휴관일·총 좌석 수는 기록 기준일의 스냅샷입니다. 실시간 잔여 좌석은 추가 확인 항목입니다. 방문 전 운영 안내는 [용인시 도서관 공식 홈페이지](https://lib.yongin.go.kr/)에서 확인합니다.

데모 확인 범위는 검색·조건 변경·빈 결과·기준일 표시·출처 확인의 사용자 흐름과 원본 수록 필드입니다. 일자별 개관 여부와 장애인 접근성은 공식 운영 안내에서 추가로 확인합니다.

## 데이터 아이디어 카탈로그

`content/data-catalog.json`의 8개 항목은 공식 상세 페이지를 2026-10-22에 확인했습니다. 아이디어와 기대 효과는 강의용 제품 제안입니다. 갱신주기·이용 조건은 데이터셋별 공식 상세정보를 기준으로 확인합니다.

특히 공중화장실 데이터는 위도·경도 제공 중단 안내가 있고, 에어코리아 대기오염정보는 공공누리 제3유형(출처표시·변경금지)이며, 기상청 단기예보는 제1유형(출처표시)입니다. API 예시의 확인 범위는 공식 상세 문서입니다. 인증키 발급·활용신청·실제 호출은 후속 연결 단계이며, 파일 다운로드와 구분해 안내합니다.
