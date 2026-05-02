# 배포 가이드

## dev → main 머지 & 푸쉬

작업이 완료된 dev 브랜치를 main에 반영할 때 사용합니다.

터미널에서 `aimforge` 폴더로 이동 후 아래 순서대로 실행하세요.

### 1. main 브랜치로 이동
```bash
git checkout main
```

### 2. dev 내용을 main에 머지
```bash
git merge dev --allow-unrelated-histories -X theirs
```
- `--allow-unrelated-histories` : 브랜치 히스토리가 달라도 머지 허용
- `-X theirs` : 충돌 발생 시 dev 내용으로 자동 덮어쓰기

### 3. main 브랜치에 푸쉬
```bash
git push https://jae1205:<TOKEN>@github.com/jae1205/aimtrainer.git main
```
`<TOKEN>` 자리에 GitHub Personal Access Token을 입력하세요.

---

## 커밋 & 푸쉬 (dev 브랜치)

평소 작업 내용을 dev 브랜치에 올릴 때 사용합니다.

```bash
git add <파일명>
git commit -m "커밋 메시지"
git push https://jae1205:<TOKEN>@github.com/jae1205/aimtrainer.git dev
```

---

## GitHub Personal Access Token 발급

토큰이 만료되면 아래 경로에서 새로 발급하세요.

1. GitHub 로그인
2. 우측 상단 프로필 → **Settings**
3. 좌측 하단 **Developer settings**
4. **Personal access tokens** → **Tokens (classic)**
5. **Generate new token** 클릭
6. 권한: `repo` 체크 후 생성

---

## Vercel 배포

- **Production 브랜치**: `main`
- `main`에 push될 때마다 Vercel이 자동으로 재배포합니다.
- 배포 상태는 [vercel.com](https://vercel.com) 대시보드에서 확인하세요.
