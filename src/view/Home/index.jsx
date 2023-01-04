import React from 'react';
import {NavLink} from 'react-router-dom';
import HomeBg from '../Example/HomeBg'
// 主页
function Home() {
  console.log(6);
    return (
      <div>
        <ul>
          <li>
            <NavLink to="/"> 主页 </NavLink>
          </li>
          <li>
            <NavLink to="/Directory"> 菜单 </NavLink>
          </li>
            </ul>
            <HomeBg />
      </div>
    );
}
export default Home;
