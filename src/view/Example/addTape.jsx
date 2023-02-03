import React, { useEffect } from 'react';
import * as THREE from 'three'; // 引入three
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineBasicMaterial
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import * as dat from 'dat.gui';
// import bg from '../../images/roadBg.webp';

let mouse = new THREE.Vector2(); //鼠标坐标

let raycaster = new THREE.Raycaster(); // 射线事件
let camera; // 相机
let scene; // 场景
let renderer; // 渲染
let controls; // 控制器

let level;
let curvePosition = [];
let isconveyor = false; //新生成、追加
let drawConveyor = null; //当前编辑的传送带
let curveMesh = null; //传送带面板
let curveState = false; // 划线状态

// 主页
function AddTape() {
  useEffect(() => {
    // 鼠标移动
    window.addEventListener('pointermove', updateLine);
    // 点击画布，事件
    window.addEventListener('click', addPoint);
    // 右键
    window.addEventListener('contextmenu', enddrawConveyor);
    // 监听窗体调整大小事件
    window.addEventListener('resize', onResize, false);
    // 初始化
    init();
  }, []);

  const init = () => {
    /* 创建一个场景，它将包含我们所有的元素，如物体，相机和灯光 */

    // 场景
    scene = new THREE.Scene();
    // 背景色
    scene.background = new THREE.Color(0x333333);

    // ********************************************* 摄像机 *******************************************
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    camera.position.x = 100;
    camera.position.y = 100;
    camera.position.z = 0;
    camera.lookAt(scene.position); // 将摄像机对准场景的中心

    // ********************************************* 光源 *******************************************
    const lights = new THREE.Group();
    lights.name = 'lightGroup';

    //点光源
    let point = new THREE.PointLight(0xfafafa);
    point.position.set(0, 1000, 300); //点光源位置
    lights.add(point); //点光源添加到场景中

    //环境光
    let ambient = new THREE.AmbientLight(0xfafafa);
    lights.add(ambient);

    // // 平行光
    // let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // lights.add(directionalLight);

    scene.add(lights);

    // ********************************************* 渲染器 *******************************************
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0xddddff)); // ?这个颜色是干啥的
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // 设置渲染器需要阴影效果

    // ********************************************* 控制器 *******************************************
    controls = new OrbitControls(camera, renderer.domElement);

    // ********************************************* 坐标轴 *******************************************
    const axes = new THREE.AxesHelper(1000);
    scene.add(axes);

    // 将渲染器的输出添加到HTML元素
    document.getElementById('homeBg').appendChild(renderer.domElement);

    createPlane(); // 创建平面
    renderScene(); // 启动动画
  };

  // 实时渲染动画
  function renderScene() {
    controls.update();
    // 使用requestAnimationFrame函数进行渲染
    requestAnimationFrame(renderScene);
    renderer.render(scene, camera);
  }

  // 随着窗体的变化修改场景
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // 创建一个平面
  function createPlane() {
    // 创建地平面并设置大小
    const planeGeometry = new THREE.PlaneGeometry(5000, 5000);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffbbaa
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    // 设置平面位置并旋转
    plane.position.x = 0;
    plane.position.y = -1;
    plane.position.z = 1;
    plane.rotation.x = -0.5 * Math.PI;

    // 设置层级
    plane.name = 'bottomLevelMesh';
    level = new THREE.Group();
    level.name = 'bottomLevel';
    level.add(plane); //对象添加到场景中

    scene.add(level);
    // scene.add(plane);
  }

  // 切换划线状态
  const changeConvey = (e) => {
    e.preventDefault();
    curveState = !curveState;
    // controls.enabled = !curveState;
  };

  // 鼠标点击落点
  const addPoint = (e) => {
    if(e?.target?.nodeName !== "CANVAS"){
      return false;
    }
    if (curveState) {
      if (e.button === 2) {
        return false;
      }

      const point = getPoint(e);
      // 添加点要记录，点的坐标，x,y,z
      if (isconveyor) {
        let newPositions = [];
        newPositions = curvePosition;

        let len = newPositions.length;

        // 如果第二次点击，只有两个点，中间插入中间点
        if (len === 6) {
          newPositions[len] = point.x;
          newPositions[len + 1] = point.y;
          newPositions[len + 2] = point.z;

          newPositions[3] = parseFloat((newPositions[0] + point.x) / 2);
          newPositions[4] = parseFloat((newPositions[1] + point.y) / 2);
          newPositions[5] = parseFloat((newPositions[2] + point.z) / 2);
        }

        if (newPositions.length > 8) {
          // 扫描
          scan();
        }

        // 补充活动点
        len = newPositions.length;
        newPositions[len] = point.x;
        newPositions[len + 1] = point.y;
        newPositions[len + 2] = point.z;

        drawConveyor.geometry.setAttribute(
          'position',
          new Float32BufferAttribute(newPositions, 3)
        );
        drawConveyor.geometry.attributes.position.needsUpdate = true;
      } else {
        // 新生成
        isconveyor = true;
        // 在点击点和鼠标之前生成一条线
        // 首先获取点击点
        const vertices = [];
        vertices.push(point.x, point.y, point.z, point.x + 10, point.y, point.z);
        curvePosition = [point.x, point.y, point.z, point.x + 10, point.y, point.z];

        // 在此坐标上画一条线
        const geometry = new BufferGeometry();
        geometry.setAttribute(
          'position',
          new Float32BufferAttribute(vertices, 3)
        );

        const material = new LineBasicMaterial({
          color: '#000000',
          toneMapped: false,
          // depthTest: false,
          side: THREE.DoubleSide
        });

        let line = new THREE.Line(geometry, material);
        console.log(line);
        line.name = 'drawConveyor';
        scene.add(line);
        drawConveyor = scene.getObjectByName('drawConveyor');
      }
    }
  };

  //鼠标移动时，更新线的最后一个坐标
  const updateLine = (e) => {
    if (curveState) {
      const point = getPoint(e);
      if (drawConveyor) {
        let positions = drawConveyor.geometry.attributes.position.array;
        let length = positions.length;

        drawConveyor.geometry.attributes.position.array[length - 1] = point.z;
        drawConveyor.geometry.attributes.position.array[length - 2] = point.y;
        drawConveyor.geometry.attributes.position.array[length - 3] = point.x;

        length = curvePosition.length;
        curvePosition[length - 1] = point.z;
        curvePosition[length - 2] = point.y;
        curvePosition[length - 3] = point.x;

        drawConveyor.geometry.attributes.position.needsUpdate = true;
      }
    }
  };

  // 获取点
  const getPoint = (event) => {
    // 坐标点
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 通过鼠标点的位置和当前相机的矩阵计算出raycaster
    raycaster.setFromCamera(mouse, camera);

    // 获取raycaster直线和所有模型相交的数组集合
    let intersects = raycaster.intersectObjects(level.children);
    let point = {};
    point.x = intersects[0].point.x;
    point.y = intersects[0].point.y + 2;
    point.z = intersects[0].point.z;

    return point;
  };

  // 扫描
  const scan = () => {
    if (curveMesh) {
      scene.remove(curveMesh);
    }

    let curvePositions = [];
    let len = curvePosition.length;
    // let len = curvePosition.length - 3;

    for (let i = 0; i < len; i += 3) {
      curvePositions.push(
        new THREE.Vector3(
          parseFloat(curvePosition[i]),
          parseFloat(curvePosition[i + 1]),
          parseFloat(curvePosition[i + 2])
        )
      );
    }

    // let curve = new THREE.LineCurve3(curvePositions);
    let curve = radius(curvePositions);
    // let curve = new THREE.CatmullRomCurve3(curvePositions);

    // let curve = new THREE.CatmullRomCurve3([
    //   new THREE.Vector3( 0, 0, 0 ),
    //   new THREE.Vector3( -50, 0, 0 ),
    //   new THREE.Vector3( -100, -50, 0 ),
    //   new THREE.Vector3( -50, -100, 0)
    // ]);

    let shape = new THREE.Shape();
    /**四条直线绘制一个矩形轮廓*/
    shape.lineTo(2, 2); //第3点
    shape.lineTo(2, 0); //第4点
    shape.moveTo(0, 0); //起点

    shape.lineTo(0, 2); //第2点

    shape.lineTo(2, 2); //第3点
    // shape.lineTo(0,0);//第5点

    // 如果之前没有扫描
    if (curveMesh) {
      curveMesh.geometry.dispose();
      scene.remove(curveMesh);
      curveMesh = null;
    }

    let geometry = new THREE.ExtrudeGeometry( //拉伸造型
      shape, //三维轮廓
      //拉伸参数
      {
        // depth: 100,
        // bevelEnabled: true,//无倒角
        extrudePath: curve, //选择扫描轨迹
        steps: 200, //沿着路径细分数
        curveSegments: 2,
        // tension: 1,//张力
        // curveType: "chordal"
        uvGenerator: THREE.ExtrudeGeometry.WorldUVGenerator
      }
    );

    // let textureLoader = new THREE.TextureLoader();
    //加载贴图图片;
    let texture = new THREE.TextureLoader().load('https://img95.699pic.com/xsj/0w/zl/x6.jpg%21/fw/700/watermark/url/L3hzai93YXRlcl9kZXRhaWwyLnBuZw/align/southeast', function () {
      renderer.render(scene, camera);
  }
);
    let material = new THREE.MeshStandardMaterial({
      // color:0xaaffdd,//设置精灵矩形区域颜色
      side: THREE.DoubleSide,
      map: texture
    });

    material.map.offset.set(0, 0); // 对齐边缘
    material.map.repeat.set(0.1, 0.1); // 1单位对应2%张图
    material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;

    let material2 = new THREE.MeshStandardMaterial({
      color: 0xffaadd,
      side: THREE.DoubleSide //两面可见
      // wireframe: true,
    }); //材质对象

    // 偏移
    // geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, 10));
    let mesh = new THREE.Mesh(geometry, [material, material]); //网格模型对象
    // let mesh = new THREE.Mesh(geometry, [material2, material]); //网格模型对象

    // mesh.geometry.setAttribute(
    //   "uv2",
    //   new THREE.Float32BufferAttribute(mesh.geometry.attributes.uv.array, 2)
    // );

    mesh.name = 'curveMesh';
    scene.add(mesh);

    curveMesh = scene.getObjectByName('curveMesh');
  };

  //圆角轨迹
  const radius = (arr) => {
    let L = 20; //控制直接交叉点过渡曲线尺寸
    let BezierArr = []; //所有拐角贝塞尔曲线集合

    for (let i = 1; i < arr.length - 1; i++) {
      //注意两端的点不用圆角化

      // 三个点坐标
      let p1 = arr[i - 1];
      let p2 = arr[i]; // 直线交点
      let p3 = arr[i + 1];
      // 计算三个点构成的两条线的方向
      let dir1 = p1.clone().sub(p2).normalize();
      let dir2 = p3.clone().sub(p2).normalize();
      // 直接交点p2作为贝塞尔曲线控制点
      // 计算贝塞尔曲线上的起始点坐标BezierP1、BezierP3
      let BezierP1 = p2.clone().add(dir1.clone().multiplyScalar(L));
      let BezierP3 = p2.clone().add(dir2.clone().multiplyScalar(L));
      // 贝赛尔曲线绘制拐角点
      let BezierCurve = new THREE.QuadraticBezierCurve3(BezierP1, p2, BezierP3);
      // pointsArr.push(...BezierCurve.getSpacedPoints(15)); //贝赛尔曲线上取一定数量点
      BezierArr.push(BezierCurve);
      // 曲线BezierCurve自定义起始点属性
      BezierCurve.startPoint = BezierP1;
      BezierCurve.endPoint = BezierP3;
    }

    // 创建组合曲线对象CurvePath
    let curve = new THREE.CurvePath();
    // 曲线组CurvePath插入第一段直线
    curve.curves.push(new THREE.LineCurve3(arr[0], BezierArr[0].startPoint));

    for (let i = 0; i < BezierArr.length; i++) {
      // 插入贝塞尔曲线
      curve.curves.push(BezierArr[i]);
      if (i < BezierArr.length - 1) {
        // 插入直线
        curve.curves.push(
          new THREE.LineCurve3(
            BezierArr[i].endPoint,
            BezierArr[i + 1].startPoint
          )
        );
      } else {
        // 插入最后一段直线
        curve.curves.push(
          new THREE.LineCurve3(BezierArr[i].endPoint, arr[arr.length - 1])
        );
      }
    }

    // // drawConveyor.geometry.setAttribute('position', new Float32BufferAttribute(newPositions, 3));
    // // drawConveyor.geometry.attributes.position.needsUpdate = true;
    //
    // // 描出轨迹
    // // let geometry = new THREE.BufferGeometry(); //创建一个缓冲类型几何体
    // let points = curve.getPoints(arr.length); //曲线上获取顶点坐标
    // // let points = curve.getSpacedPoints(20); //曲线上获取顶点坐标
    //
    // drawConveyor.geometry.setFromPoints(points);
    //
    // // geometry.setFromPoints([arr[0], ...pointsArr, arr[arr.length - 1]]);
    // // let material = new THREE.LineBasicMaterial({
    // //   color: 0x00ffff,
    // // });
    //
    // // let line = new THREE.Line(geometry, material);
    // // scene.add(line);

    return curve;
  };

  // 右键结束画传送带
  const enddrawConveyor = (e) => {
    if (curveState) {
      e.preventDefault();

      //清掉最后一段线
      let newPositions = curvePosition.slice(0, curvePosition.length - 3);

      drawConveyor.geometry.setAttribute(
        'position',
        new Float32BufferAttribute(newPositions, 3)
      );
      drawConveyor.geometry.attributes.position.needsUpdate = true;

      // console.log("ddd",curvePosition)

      // 清掉传送带
      drawConveyor.name = '';
      drawConveyor = null;
      isconveyor = false;
      curvePosition = [];
      curveState = false;
      // controls.enabled = true;
      return false;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={changeConvey}
        style={{ position: 'fixed', right: '20px', zIndex: 99 }}
      >
        {curveState ? "停止" : "划线"}
      </button>
      <div id="homeBg" className="home-bg"></div>
    </>
  );
}

export default AddTape;
