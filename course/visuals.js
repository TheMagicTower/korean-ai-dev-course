// Small learning interactions run locally; no network, storage, or paid calls.
(()=>{
  const button=document.getElementById('demo-complete');
  const reset=document.getElementById('demo-reset');
  if(button&&reset){
    button.addEventListener('click',()=>{
      document.getElementById('demo-status').textContent='완료 · 화면만 변경';
      document.getElementById('demo-explanation').textContent='상태가 완료로 바뀌고 중복 클릭은 막았습니다. 하지만 실제 저장·사용자 권한·실패 응답은 아직 구현되지 않았습니다. 새로고침하면 상태가 돌아옵니다.';
      button.disabled=true;button.textContent='완료 처리됨';
    });
    reset.addEventListener('click',()=>{
      document.getElementById('demo-status').textContent='미처리';
      document.getElementById('demo-explanation').textContent='초기화했습니다. 다음 질문: 상태가 유지되어야 한다면 어디에 저장하고, 실패하면 무엇을 보여 줄까요?';
      button.disabled=false;button.textContent='처리 완료';
    });
  }
  const unit=document.getElementById('cost-unit'),retries=document.getElementById('cost-retries');
  if(!unit||!retries)return;
  const format=n=>n.toLocaleString('ko-KR');
  function update(){
    const u=Number(unit.value),r=Number(retries.value),total=u*(r+1);
    document.getElementById('cost-unit-label').textContent=format(u)+'원';
    document.getElementById('cost-retries-label').textContent=r+'회';
    document.getElementById('cost-y-mid').textContent=format(u*3);
    document.getElementById('cost-y-max').textContent=format(u*6);
    document.getElementById('cost-point').setAttribute('cx',70+96*r);
    document.getElementById('cost-point').setAttribute('cy',220-190*(r+1)/6);
    const text=`${format(u)}원 × (첫 시도 1회 + 재시도 ${r}회) = ${format(total)}원`;
    document.getElementById('cost-result').textContent=text;
    document.getElementById('cost-description').textContent='교육용 선형 계산. '+text+'입니다. 세로축은 0원부터 '+format(u*6)+'원까지입니다. 아래 표에서 전체 값을 읽을 수 있습니다.';
    document.getElementById('cost-data').innerHTML=Array.from({length:6},(_,i)=>`<tr><td>${i}회</td><td>${i+1}회</td><td>${format(u*(i+1))}원</td></tr>`).join('');
  }
  unit.addEventListener('input',update);retries.addEventListener('input',update);update();
})();
