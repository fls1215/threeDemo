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
let curvePosition = []; // 鼠标点击的点,就一个数组，所以就画一条线
let curveVertices = []; // 生成的线上实际的坐标点
let isconveyor = false; //false新生成、true追加
let drawConveyor = null; //当前编辑的线
let curveState = false; // 划线状态
let type = 'line'; // 线的类型

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
    camera.position.x = 0;
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
    renderer.setClearColor(new THREE.Color(0xddddff));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // 设置渲染器需要阴影效果

    // ********************************************* 控制器 *******************************************
    controls = new OrbitControls(camera, renderer.domElement);

    // ********************************************* 坐标轴 *******************************************
    const axes = new THREE.AxesHelper(1000);
    scene.add(axes);

    const grid = new THREE.GridHelper( 100, 10, 0xe3b4b8, 0xc8adc4 );
    scene.add(grid);

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
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xf9e8d0
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
  }

  // 切换划线状态
  const changeConvey = (e) => {
    curveState = !curveState;
  };

  // 切换划线类型
  const changeType = (type) => {
    type = type;
  };

  // 鼠标点击落点
  const addPoint = (e) => {
    if (e?.target?.nodeName !== 'CANVAS') {
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

        console.log('181', newPositions);

        if (newPositions.length > 8) {
          // 记录点击点的坐标,最后一个是鼠标实时位置
          newPositions[len - 3] = point.x;
          newPositions[len - 2] = point.y;
          newPositions[len - 1] = point.z;

          // 两个点只能成一条直线，当有效点数大于2之后，最后3个点组成贝塞尔曲线上的3个点，然后反推控制点，新点组合画贝塞尔曲线
          // 计算曲线-------
          // 于0.5处反求控制点，在x,z平面绘制
          let x1 =
            2 * newPositions[len - 6] -
            newPositions[len - 9] / 2 -
            newPositions[len - 3] / 2;
          let z1 =
            2 * newPositions[len - 4] -
            newPositions[len - 7] / 2 -
            newPositions[len - 1] / 2;

            // 绘制贝塞尔曲线
          const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(
              newPositions[len - 9],
              newPositions[len - 8],
              newPositions[len - 7]
            ),// 起始点
            new THREE.Vector3(x1, newPositions[len - 2], z1), // z同最后一个点的z,控制点
            new THREE.Vector3(
              newPositions[len - 3],
              newPositions[len - 2],
              newPositions[len - 1]
            )// 结束点
          );

          const points = curve.getPoints(40);
          const vertices = curveVertices; 
          // 填入40个组成曲线的点
          points.forEach((point) => {
            vertices.push(point.x);
            vertices.push(point.y); 
            vertices.push(point.z);
          })
          
          const verticesLength = vertices.length;
          // 鼠标点
          vertices[verticesLength] = point.x + 0.01;
          vertices[verticesLength + 1] = point.y;
          vertices[verticesLength + 2] = point.z;
          console.log("vertices",vertices);
          drawConveyor.geometry.setAttribute(
            'position',
            new Float32BufferAttribute(vertices, 3) // 转换成3坐标数组形式
          );
          drawConveyor.geometry.attributes.position.needsUpdate = true;

          // 鼠标点
          newPositions[len] = point.x + 0.01;
          newPositions[len + 1] = point.y;
          newPositions[len + 2] = point.z;
        } else {
          // 计算直线
          const vertices = [];
          vertices.push(
            newPositions[0],
            newPositions[1],
            newPositions[2],
            point.x,
            point.y,
            point.z,
            point.x + 0.01,
            point.y,
            point.z
          );
          // 记录点击点的坐标,最后一个是鼠标实时位置
          curvePosition = [
            newPositions[0],
            newPositions[1],
            newPositions[2],
            point.x,
            point.y,
            point.z,
            point.x + 0.01,
            point.y,
            point.z
          ];

          // 补充鼠标所在点
          len = newPositions.length;
          newPositions[len] = point.x;
          newPositions[len + 1] = point.y;
          newPositions[len + 2] = point.z;

          drawConveyor.geometry.setAttribute(
            'position',
            new Float32BufferAttribute(newPositions, 3)
          );
          drawConveyor.geometry.attributes.position.needsUpdate = true;
        }

      } else {
        // 新生成
        isconveyor = true;
        // 在点击点和鼠标之前生成一条线
        // 首先获取点击点
        const vertices = [];
        vertices.push(
          point.x,
          point.y,
          point.z,
          point.x + 0.01,
          point.y,
          point.z
        );
        curvePosition = [
          point.x,
          point.y,
          point.z,
          point.x + 0.01,
          point.y,
          point.z
        ];

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
        // let line = new THREE.LineSegments(geometry, material);
        console.log(line);
        line.frustumCulled = false; // 阻止场景中的线原点消失时消失，不进行视锥体剔除
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
    point.y = intersects[0].point.y + 0.04; // 避免线断
    point.z = intersects[0].point.z;

    return point;
  };

  // 右键结束
  const enddrawConveyor = (e) => {
    if (curveState) {
      e.preventDefault();

      //清掉最后一段线
      let newPositions = curvePosition.slice(0, curvePosition.length - 3);

      drawConveyor.geometry.setAttribute(
        'position',
        new Float32BufferAttribute(curveVertices, 3)
      );
      drawConveyor.geometry.attributes.position.needsUpdate = true;

      // 清掉线
      drawConveyor.name = '';
      drawConveyor = null;
      isconveyor = false;
      curvePosition = [];
      curveState = false;

      return false;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={changeConvey}
        style={{ position: 'fixed', left: '20px', zIndex: 99 }}
      >
        {curveState ? '停止' : '划线'}
      </button>
      {/* <button
        type="button"
        onClick={changeType('line')}
        style={{ position: 'fixed', left: '80px', zIndex: 99 }}
      >
        直线
      </button>
      <button
        type="button"
        onClick={changeType('curve')}
        style={{ position: 'fixed', left: '120px', zIndex: 99 }}
      >
        曲线
      </button> */}
      <div id="homeBg" className="home-bg"></div>
    </>
  );
}

export default AddTape;
