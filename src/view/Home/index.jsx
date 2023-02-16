import React from 'react';
import {NavLink} from 'react-router-dom';
// import HomeBg from '../Example/addCube' // 添加立方体
// import HomeBg from '../Example/addTape' // 手动添加曲线并扫描成线带 
import HomeBg from '../Example/addCurve' // 手动添加曲线

// 主页
function Home() {
    return (
      <div>
        {/* <ul>
          <li>
            <NavLink to="/"> 主页 </NavLink>
          </li>
          <li>
            <NavLink to="/Directory"> 菜单 </NavLink>
          </li>
            </ul> */}
            <HomeBg />
      </div>
    );
}
export default Home;
