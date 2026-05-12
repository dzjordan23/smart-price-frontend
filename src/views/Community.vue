<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'

const activeTab = ref(0)

// 论坛 mock 数据
const forumPosts = ref([
  { id: 1, avatar: '', nickname: '省钱达人小王', title: 'iPhone 16 各平台价格汇总，最低价在这里！', content: '花了两天时间对比了京东、淘宝、拼多多、抖音的价格，发现一个隐藏优惠...', likes: 328, comments: 56, time: '10分钟前' },
  { id: 2, avatar: '', nickname: '数码爱好者', title: 'MacBook Air M4 值得入手吗？深度体验分享', content: '用了一周，说说真实感受。续航确实惊艳，但也有一些不足...', likes: 215, comments: 89, time: '30分钟前' },
  { id: 3, avatar: '', nickname: '宝妈好物圈', title: '海蓝之谜 vs 兰蔻小黑瓶，到底哪个更划算？', content: '两个都用过，从性价比角度来说...', likes: 156, comments: 34, time: '1小时前' },
  { id: 4, avatar: '', nickname: '薅羊毛专业户', title: '618必看！这些平台满减规则别踩坑', content: '每年都有人被复杂的满减规则搞晕，我整理了一张思维导图...', likes: 542, comments: 128, time: '2小时前' },
])

// 好物推荐 mock 数据
const recommendItems = ref([
  { id: 1, image: '', name: '戴森V15 Detect无绳吸尘器', reason: '吸力超强，激光探测灰尘，用了半年家里焕然一新', recommender: '家居达人Lisa', price: 4290 },
  { id: 2, image: '', name: 'Switch OLED 马力欧红蓝限定版', reason: '手感超棒，屏幕色彩鲜艳，周末朋友聚会神器', recommender: '游戏控阿杰', price: 2349 },
  { id: 3, image: '', name: '茅台飞天53度500ml', reason: '稀缺好价！比市场均价低200，赶紧冲', recommender: '老酒收藏家', price: 2699 },
  { id: 4, image: '', name: 'AirPods Pro 2 USB-C版', reason: '降噪效果一流，通话清晰，通勤必备', recommender: '通勤族小张', price: 1599 },
])

// 二手转售 mock 数据
const resaleItems = ref([
  { id: 1, name: 'iPad Pro 12.9 M2 256G WiFi', originalPrice: 8999, salePrice: 6200, condition: '95新 无划痕', seller: '数码小陈', time: '3小时前', views: 89 },
  { id: 2, name: '索尼WH-1000XM5 降噪耳机', originalPrice: 2999, salePrice: 1800, condition: '9成新 有轻微使用痕迹', seller: '音乐发烧友', time: '5小时前', views: 56 },
  { id: 3, name: '戴森吹风机 HD15', originalPrice: 3299, salePrice: 2100, condition: '95新 配件齐全', seller: '美妆博主小鱼', time: '1天前', views: 123 },
])

// 评价晒单 mock 数据
const reviews = ref([
  { id: 1, product: 'iPhone 16 Pro Max 256GB', rating: 5, content: '从智选比价发现拼多多百亿补贴最便宜，省了400块！手机到手验了是正品，很开心。', user: '理智消费者', images: [], platform: '拼多多', time: '2小时前' },
  { id: 2, product: '戴森V15吸尘器', rating: 4, content: '京东入手，比官网便宜300，物流很快。就是颜色没得选了，其他都很满意。', user: '洁癖患者', images: [], platform: '京东', time: '5小时前' },
  { id: 3, product: '海蓝之谜面霜60ml', rating: 5, content: '通过智选比价对比了6个平台，淘宝直播间最划算，还送了小样。质地滋润不油腻，敏感肌友好。', user: '护肤小白兔', images: [], platform: '淘宝', time: '1天前' },
])
</script>

<template>
  <div class="page community-page">
    <van-nav-bar title="社群互动" :border="false" class="nav-bar" />

    <van-tabs v-model:active="activeTab" class="community-tabs" animated swipeable>
      <!-- 论坛 -->
      <van-tab title="论坛">
        <div class="tab-content">
          <div v-for="post in forumPosts" :key="post.id" class="post-item card">
            <div class="post-header">
              <div class="avatar-placeholder">
                <van-icon name="user-o" size="16" />
              </div>
              <div class="post-meta">
                <span class="nickname">{{ post.nickname }}</span>
                <span class="time">{{ post.time }}</span>
              </div>
            </div>
            <h4 class="post-title">{{ post.title }}</h4>
            <p class="post-content">{{ post.content }}</p>
            <div class="post-actions">
              <span class="action-item"><van-icon name="good-job-o" /> {{ post.likes }}</span>
              <span class="action-item"><van-icon name="chat-o" /> {{ post.comments }}</span>
              <span class="action-item"><van-icon name="share-o" /> 分享</span>
            </div>
          </div>
        </div>
        <div class="float-btn">
          <van-button type="primary" round icon="edit" size="small" @click="showToast('发帖功能开发中')">发帖</van-button>
        </div>
      </van-tab>

      <!-- 好物推荐 -->
      <van-tab title="好物推荐">
        <div class="tab-content">
          <div v-for="item in recommendItems" :key="item.id" class="recommend-item card">
            <div class="recommend-image">
              <van-icon name="photo-o" size="48" color="var(--text-muted)" />
            </div>
            <div class="recommend-info">
              <h4 class="recommend-name">{{ item.name }}</h4>
              <p class="recommend-reason">{{ item.reason }}</p>
              <div class="recommend-footer">
                <span class="recommend-price">¥{{ item.price }}</span>
                <span class="recommend-user">@{{ item.recommender }}</span>
              </div>
            </div>
          </div>
        </div>
      </van-tab>

      <!-- 二手转售 -->
      <van-tab title="二手转售">
        <div class="tab-content">
          <div v-for="item in resaleItems" :key="item.id" class="resale-item card">
            <div class="resale-header">
              <h4 class="resale-name">{{ item.name }}</h4>
              <span class="resale-views"><van-icon name="eye-o" /> {{ item.views }}</span>
            </div>
            <div class="resale-prices">
              <span class="sale-price">¥{{ item.salePrice }}</span>
              <span class="original-price">原价 ¥{{ item.originalPrice }}</span>
              <van-tag type="danger" size="small" round>
                省{{ item.originalPrice - item.salePrice }}元
              </van-tag>
            </div>
            <div class="resale-footer">
              <span class="condition">{{ item.condition }}</span>
              <span class="seller">@{{ item.seller }}</span>
              <span class="time">{{ item.time }}</span>
            </div>
          </div>
        </div>
        <div class="float-btn">
          <van-button type="primary" round icon="plus" size="small">发布闲置</van-button>
        </div>
      </van-tab>

      <!-- 评价晒单 -->
      <van-tab title="评价晒单">
        <div class="tab-content">
          <div v-for="review in reviews" :key="review.id" class="review-item card">
            <div class="review-header">
              <span class="review-product">{{ review.product }}</span>
              <van-tag plain size="small" round>{{ review.platform }}</van-tag>
            </div>
            <div class="review-rating">
              <van-rate v-model="review.rating" :size="14" readonly color="var(--color-warning)" void-icon="star" void-color="var(--text-muted)" />
            </div>
            <p class="review-content">{{ review.content }}</p>
            <div class="review-footer">
              <span class="review-user">@{{ review.user }}</span>
              <span class="time">{{ review.time }}</span>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<style lang="scss" scoped>
.community-page {
  padding: 0;
  padding-bottom: calc(80px + #{$safe-bottom});
}

.nav-bar {
  margin: 0;
}

.community-tabs {
  :deep(.van-tabs__wrap) {
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
  }
  :deep(.van-tab) {
    color: var(--text-secondary);
  }
  :deep(.van-tab--active) {
    color: var(--color-primary);
  }
  :deep(.van-tabs__line) {
    background: var(--color-primary);
  }
}

.tab-content {
  padding: $spacing-md;
}

// 论坛帖子
.post-item {
  padding: $spacing-md;
}

.post-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.post-meta {
  display: flex;
  flex-direction: column;
  .nickname { font-size: $font-sm; font-weight: 600; color: var(--text-primary); }
  .time { font-size: $font-xs; color: var(--text-muted); }
}

.post-title {
  font-size: $font-md;
  font-weight: 600;
  margin-bottom: $spacing-sm;
  line-height: 1.4;
}

.post-content {
  font-size: $font-sm;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: $spacing-sm;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-actions {
  display: flex;
  gap: $spacing-lg;
  .action-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: $font-xs;
    color: var(--text-muted);
  }
}

// 好物推荐
.recommend-item {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
}

.recommend-image {
  width: 80px;
  height: 80px;
  border-radius: $radius-md;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recommend-info {
  flex: 1;
  min-width: 0;
}

.recommend-name {
  font-size: $font-md;
  font-weight: 600;
  margin-bottom: $spacing-xs;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recommend-reason {
  font-size: $font-xs;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: $spacing-sm;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recommend-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .recommend-price { font-size: $font-md; font-weight: 700; color: var(--color-danger); }
  .recommend-user { font-size: $font-xs; color: var(--text-muted); }
}

// 二手转售
.resale-item {
  padding: $spacing-md;
}

.resale-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
  .resale-name { font-size: $font-md; font-weight: 600; flex: 1; }
  .resale-views { font-size: $font-xs; color: var(--text-muted); display: flex; align-items: center; gap: 2px; }
}

.resale-prices {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
  .sale-price { font-size: $font-xl; font-weight: 800; color: var(--color-danger); }
  .original-price { font-size: $font-sm; color: var(--text-muted); text-decoration: line-through; }
}

.resale-footer {
  display: flex;
  gap: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px solid var(--border-color);
  font-size: $font-xs;
  color: var(--text-muted);
  .condition { color: var(--color-primary); }
}

// 评价晒单
.review-item {
  padding: $spacing-md;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;
  .review-product { font-size: $font-md; font-weight: 600; flex: 1; }
}

.review-rating {
  margin-bottom: $spacing-sm;
}

.review-content {
  font-size: $font-sm;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: $spacing-sm;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  font-size: $font-xs;
  color: var(--text-muted);
}

// 悬浮按钮
.float-btn {
  position: fixed;
  right: $spacing-lg;
  bottom: calc(100px + #{$safe-bottom});
  z-index: 50;
}

.nav-bar {
  margin: (-$spacing-md) (-$spacing-md) $spacing-md;
}
</style>
