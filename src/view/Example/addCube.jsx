import React, { useEffect } from 'react';
import * as THREE from 'three'; // 引入three
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';

// 主页
function AddCube() {

  useEffect(() => {
    init();
  }, []);

  let camera;
  let renderer;
  const init = () => {
    /* 创建一个场景，它将包含我们所有的元素，如物体，相机和灯光 */

    // 场景
    const scene = new THREE.Scene();
    // 背景色
    scene.background = new THREE.Color(0xffdddd);

    // 摄像机
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.x = -50;
    camera.position.y = 100;
    camera.position.z = 100;
    camera.lookAt(scene.position); // 将摄像机对准场景的中心

    // 渲染器
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0xddddff));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // 设置渲染器需要阴影效果

    // 控制器
    const orbit = new OrbitControls(camera, renderer.domElement);

    // 坐标轴
    const axes = new THREE.AxesHelper(100);
    scene.add(axes);

    // 将渲染器的输出添加到HTML元素
    document.getElementById('homeBg').appendChild(renderer.domElement);

    // 实时渲染动画
    function renderScene() {
      orbit.update();
      // 使用requestAnimationFrame函数进行渲染
      requestAnimationFrame(renderScene);
      renderer.render(scene, camera);
    }
    renderScene(); // 启动动画

    // 创建一个平面
    function createPlane() {
      // 创建地平面并设置大小
      const planeGeometry = new THREE.PlaneGeometry(100, 100);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0xaeaeae
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);

      // 设置平面位置并旋转
      plane.position.x = 0;
      plane.position.y = 0;
      plane.position.z = 0;
      plane.rotation.x = -0.5 * Math.PI;
      scene.add(plane);
    }
    createPlane();

    // 随着窗体的变化修改场景
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize, false); // 监听窗体调整大小事件

    /* 使用 dat.gui 调试库 */
    // 对象参数
    const controls = {
      // 自定义长方体参数 长宽高 三维坐标 颜色 添加方法
      boxLength: 10,
      boxWidth: 10,
      boxDeepth: 10,
      boxX: 0,
      boxY: 5,
      boxZ: 0,
      boxColor: '#123456',
      addDiyBox: function () {
        console.log("add");
        // 创建一个立方体并设置大小
        const cubeGeometry = new THREE.BoxGeometry(
          this.boxWidth,
          this.boxDeepth,
          this.boxLength
        );
        // MeshBasicMaterial设置材质
        const cubeMaterial = new THREE.MeshBasicMaterial({
          color: this.boxColor,
          // wireframe: true // 线性
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

        // 设置该物体投射阴影
        cube.castShadow = true;

        // 设置立方体位置
        cube.position.x = this.boxX;
        cube.position.y = this.boxY;
        cube.position.z = this.boxZ;
        scene.add(cube);

        this.boxWidth = 10;
        this.boxDeepth = 10;
        this.boxLength = 10;
        this.boxX = 0;
        this.boxY = 5;
        this.boxZ = 0;
        this.boxColor = 0x123456;
      },

      // 移除场景中的对象，移除添加到场景中的最后一个对象
      removeCube: function () {
        // 获取场景中的所有对象
        const allChildren = scene.children;
        const lastObject = allChildren[allChildren.length - 1];
        // 只移除THREE.Mesh对象
        if (lastObject instanceof THREE.Mesh) {
          scene.remove(lastObject);
        }
      }
    };
    // 实例化
    const gui = new dat.GUI();

    const diyBoxFolder = gui.addFolder(' [ 自定义长方体 ] ');
    diyBoxFolder.open();
    diyBoxFolder
      .add(controls, 'boxLength')
      .min(0)
      .max(50)
      .step(1)
      .name('长度')
      .listen();
    diyBoxFolder
      .add(controls, 'boxWidth')
      .min(0)
      .max(50)
      .step(1)
      .name('宽度')
      .listen();
    diyBoxFolder
      .add(controls, 'boxDeepth')
      .min(0)
      .max(50)
      .step(1)
      .name('高度')
      .listen();
    diyBoxFolder
      .add(controls, 'boxX')
      .min(0)
      .max(50)
      .step(1)
      .name('x坐标')
      .listen();
    diyBoxFolder
      .add(controls, 'boxY')
      .min(0)
      .max(50)
      .step(1)
      .name('y坐标')
      .listen();
    diyBoxFolder
      .add(controls, 'boxZ')
      .min(0)
      .max(50)
      .step(1)
      .name('z坐标')
      .listen();
    diyBoxFolder.addColor(controls, 'boxColor').name('颜色').listen();
    diyBoxFolder.add(controls, 'addDiyBox').name('添加长方体');

    // 文件夹 - 删除
    const deleteFolder = gui.addFolder('【 删除 】');
    deleteFolder.add(controls, 'removeCube').name('删除最后一个Mesh');

    // gui 窗口放到左上角
    // gui.domElement.style = "position:absolute;top:0px;left:0px";
  };

  return <div id="homeBg" className="home-bg"></div>;
}

export default AddCube;
