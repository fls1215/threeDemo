import React from 'react';
import { useRoutes } from "react-router-dom";

// 路由懒加载
const LazyLoad = (path) => { 
    //传入在view 下的路径
    const Comp = React.lazy(() => import(`../view${path}`))
    return (
        <React.Suspense fallback={<> 加载中...</>}>
            <Comp />
        </React.Suspense>
    )
}

function Element() {
    const element = useRoutes([
        {
            path: '/',
            element: LazyLoad('/Home')
        },
        {
            path: '/directory',
            element: LazyLoad('/Directory')
        },
        {
            path: '*',
            element: LazyLoad('/Page404')
        }
    ])
    return (element);
}
export default Element;
