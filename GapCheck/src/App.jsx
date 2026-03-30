import { useState } from 'react';

function App() {
  // State(상태): 리액트에서 화면에 변경되어야 하는 데이터를 다룰 때 사용합니다.
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>안녕하세요! 나의 첫 리액트 앱 🚀</h1>
      <p>버튼을 누른 횟수: {count}</p>
      
      {/* 버튼을 누르면 setCount를 통해 count 값이 1 증가합니다. */}
      <button onClick={() => setCount(count + 1)}>
        클릭해 보세요!
      </button>
    </div>
  );
}

export default App;