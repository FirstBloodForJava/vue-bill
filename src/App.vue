<script setup lang="ts">
import BillIndex from './components/BillIndex.vue'
</script>

<template>
  <!-- <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="30" height="30" />
  </header> -->

  <div id="app">
    <!-- 导航链接 -->
    <nav>
      <router-link to="/">查询</router-link> |
      <router-link to="/save">新增</router-link>
    </nav>

    <!-- 路由内容显示区域 -->
    <router-view />
  </div>
  <!-- <div>
    <BillIndex />
  </div> -->
</template>
