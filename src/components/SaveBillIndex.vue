<template>
    <div class="calendar-container">
        <el-calendar v-model="currentDate" @change="handleMonthChange" ref="calendar">
            <!-- 自定义头 -->
            <template #header="{ date }">
                <span>新增页面 </span>
                <span :class = "['amount, negative']">{{ getMonthlyOutAmount(date) }}</span>
                <span :class = "['amount, positive']">{{ getMonthlyInAmount(date) }}</span>
                <span>{{ date }}</span>
                <el-button-group>
                    <el-button size="small" @click="selectDate('prev-year')">
                        上一年
                    </el-button>
                    <el-button size="small" @click="selectDate('prev-month')">
                        上一月
                    </el-button>
                    <el-button size="small" @click="selectDate('today')">
                        今天
                    </el-button>
                    <el-button size="small" @click="selectDate('next-month')">
                        下一月
                    </el-button>
                    <el-button size="small" @click="selectDate('next-year')">
                        下一年
                    </el-button>
                </el-button-group>
            </template>

            <template #date-cell="{ data }">
                <div class="custom-cell" @mouseenter="handleMouseEnter(data.day, $event)" @mouseleave="hoverDate = null"
                    @click="handleCellClick(data.day)">
                    <div class="day-number">{{ data.day.split('-')[2] }}</div>
                    <div
                        :class="['amount', { 'positive': dailyAmounts[data.day] > 0, 'negative': dailyAmounts[data.day] < 0 }]">
                        {{ getDailyAmountCount(data.day) }}
                    </div>

                    <!-- 明细悬浮框 -->
                    <transition name="fade">

                        <!-- 只有日期和事件的显示 -->
                        <!-- <div v-if="hoverDate === data.day && dailyDetails[data.day]?.length" class="detail-tooltip"
                            :style="tooltipStyle">
                            <div class="tooltip-header">{{ data.day }} 明细</div>
                            <div class="detail-list">
                                <div v-for="(detail, index) in dailyDetails[data.day]" :key="index" class="detail-item">
                                    <span class="time">{{ formatTime(detail.tradeDate) }}</span>
                                    <span></span>
                                    <span :class="['detail-amount', {
                                        'positive': detail.amount > 0,
                                        'negative': detail.amount < 0
                                    }]">
                                        {{ detail.payType }} {{ detail.tradeType }} {{ formatAmount(detail.amount) }}
                                    </span>
                                </div>
                            </div>
                            <div class="tooltip-footer">
                                合计：{{ formatAmount(dailyAmounts[data.day]) }}
                            </div>
                        </div> -->

                        <div v-if="hoverDate === data.day && dailyDetails[data.day]?.length" class="detail-tooltip"
                            :style="tooltipStyle">
                            <div class="tooltip-header">
                                <span class="date">{{ data.day }}</span>
                                <span class="total">合计：{{ formatAmount(dailyAmounts[data.day]) }}</span>
                            </div>

                            <div class="table-container">
                                <table class="detail-table">
                                    <thead>
                                        <tr>
                                            <th class="time-col">时间</th>
                                            <th class="amount-col">金额</th>
                                            <th class="type-col">支付方式</th>
                                            <th class="type-col">交易类型</th>
                                            <th class="remark-col">说明</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(detail, index) in dailyDetails[data.day]" :key="index"
                                            class="table-row">
                                            <td class="time">{{ formatTime(detail.tradeDate) }}</td>
                                            <td :class="['amount', {
                                                'positive': detail.amount > 0,
                                                'negative': detail.amount < 0
                                            }]">
                                                {{ formatAmount(detail.amount) }}
                                            </td>
                                            <td>
                                                <span class="type-tag pay-type">
                                                    {{ detail.payType }}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="type-tag trade-type">
                                                    {{ detail.tradeType }}
                                                </span>
                                            </td>
                                            <td class="remark" :title="detail.rmk">
                                                {{ detail.rmk || '-' }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </transition>

                </div>
            </template>
        </el-calendar>

        <!-- 右侧编辑抽屉 -->
        <el-drawer v-model="drawerVisible" title="账单详情" direction="rtl" size="40%" :before-close="handleDrawerClose">
            <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
                <el-form-item label="交易类型" prop="tradeType">
                    <el-select v-model="formData.tradeType">
                        <el-option v-for="item in tradeTypeOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>

                <el-form-item label="支付方式" prop="payType">
                    <el-select v-model="formData.payType">
                        <el-option v-for="item in payTypeOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                    </el-select>
                </el-form-item>

                <el-form-item label="金额" prop="amount">
                    <el-input-number v-model="formData.amount" :precision="2" :controls="false" />
                </el-form-item>

                <el-form-item label="交易时间" prop="tradeDate">
                    <el-date-picker v-model="formData.tradeDate" type="datetime" format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss" />
                </el-form-item>

                <el-form-item label="备注说明" prop="rmk">
                    <el-input v-model="formData.rmk" type="textarea" :rows="3" />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" :loading="submitting" @click="handleSubmit">
                        保存
                    </el-button>
                    <el-button @click="drawerVisible = false">取消</el-button>
                </el-form-item>
            </el-form>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { CalendarDateType, CalendarInstance, ElCalendar, ElMessage  } from 'element-plus'
import dayjs from 'dayjs'
import axios from 'axios'

const calendar = ref<CalendarInstance>()
// 自定义按钮
const selectDate = (val: CalendarDateType) => {
    if (!calendar.value) return
    calendar.value.selectDate(val)
    fetchBillData()
}

const currentDate = ref<dayjs>(new Date())
const rawBillData = ref<BillData[]>([])
const loading = ref(false)

const hoverDate = ref<string | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })

// 创建axios实例
const http = axios.create({
    baseURL: 'http://47.101.155.205:8080',
    timeout: 18000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// 账单数据类型
interface BillData {
    id: number
    tradeDate: string
    amount: number
    payType: string
    rmk: string
    tradeType: string
    inOrOut: string
}
// 表单数据
interface BillForm {
    id: number
    tradeType: string
    payType: string
    amount: number
    tradeDate: string
    rmk: string
}


// 数组处理数据 累加计算 需要解决精度问题
const dailyAmounts = computed(() => {
    const result: Record<string, number> = {}
    rawBillData.value.forEach(bill => {
        const dateKey = formatDateKey(bill.tradeDate)
        // 解决精度问题
        result[dateKey] = (Math.round((result[dateKey] || 0) * 100) + Math.round(bill.amount * 100)) / 100
    })
    return result
})

const outMonthlyAmount = computed(() => {
    const result: Record<string, number> = {}
    rawBillData.value.forEach(bill => {
        const dateKey = formatDateKey(bill.tradeDate.substring(0, 7))
        // 解决精度问题
        if (bill.amount < 0) {
            result[dateKey] = (Math.round((result[dateKey] || 0) * 100) + Math.round(bill.amount * 100)) / 100
        }

    })
    return result
})
const inMonthlyAmount = computed(() => {
    const result: Record<string, number> = {}
    rawBillData.value.forEach(bill => {
        const dateKey = formatDateKey(bill.tradeDate.substring(0, 7))
        // 解决精度问题
        if (bill.amount > 0) {
            result[dateKey] = (Math.round((result[dateKey] || 0) * 100) + Math.round(bill.amount * 100)) / 100
        }

    })
    return result
})

// 获取每月支出
const getMonthlyOutAmount = (dateString: string) => {
    console.log(parseChineseYearMonth(dateString));
    
    //console.log(dateString).format('YYYY年MM月')
    
    return outMonthlyAmount.value[parseChineseYearMonth(dateString)] || 0
}
const getMonthlyInAmount = (dateString: string) => {

    return inMonthlyAmount.value[parseChineseYearMonth(dateString)] || 0
}

function parseChineseYearMonth(input) {
  // 提取数字部分
  const match = input.match(/(\d{4})\D*(\d{1,2})\D*/)
  if (!match) return ''

  const year = match[1]
  const month = match[2].padStart(2, '0')

  return `${year}-${month}`
}


// 按日期分组的明细数据
const dailyDetails = computed(() => {
    const result: Record<string, BillData[]> = {}
    rawBillData.value.forEach(bill => {
        const dateKey = formatDateKey(bill.tradeDate)
        if (!result[dateKey]) {
            result[dateKey] = []
        }
        result[dateKey].push(bill)
    })
    return result
})


// 调用接口获取数据
const fetchBillData = async () => {
    try {
        loading.value = true

        // 构造请求参数
        const params = {
            //year: currentDate.value.getFullYear(),
            //month: currentDate.value.getMonth() + 1
        }
        console.log(currentDate.value);


        // 发送POST请求
        const response = await http.post('/getAll', params)

        // 处理响应数据
        if (response.status === 200) {
            rawBillData.value = response.data || []
        } else {
            throw new Error(response.data?.message || '请求失败')
        }
    } catch (error) {
        console.error('接口请求错误:', error)
        ElMessage.error('数据获取失败: ' + error.message)
        rawBillData.value = []
    } finally {
        loading.value = false
    }
}

// 日期变化处理
const handleMonthChange = (date: dayjs) => {
    currentDate.value = date
    fetchBillData()
}

// 获取每日金额
const getDailyAmountCount = (dateString: string) => {
    return dailyAmounts.value[dateString] || 0
}

// 格式化金额
const formatAmount = (amount: number) => {
    return `${amount.toFixed(2)}`
}

// 日期格式标准化（去除时间部分）
const formatDateKey = (dateString: string) => {
    return dateString.split(' ')[0]
}


// 初始加载数据
onMounted(() => {
    fetchBillData()
})


// 处理鼠标进入事件
const handleMouseEnter = (date: string, event: MouseEvent) => {
    hoverDate.value = date
    updateTooltipPosition(event)
}

// 更新悬浮框位置
const updateTooltipPosition = (event: MouseEvent) => {
    const padding = 15 // 距离鼠标的边距
    const viewportWidth = window.innerWidth
    const tooltipWidth = 260 // 悬浮框宽度

    tooltipPosition.value = {
        x: event.clientX + padding + tooltipWidth > viewportWidth
            ? event.clientX - tooltipWidth - padding
            : event.clientX + padding,
        y: event.clientY + padding
    }
}

// 悬浮框样式
const tooltipStyle = computed(() => ({
    left: `${tooltipPosition.value.x}px`,
    top: `${tooltipPosition.value.y}px`
}))

// 时间格式化
const formatTime = (dateString: string) => {
    return dateString.split(' ')[1].substring(0, 5)
}

// 新增功能
// 表单数据
const formData = reactive<BillForm>({
    tradeType: undefined,
    payType: '',
    amount: 0,
    tradeDate: '',
    rmk: ''
})

// 表单验证规则
const formRules = {
    tradeType: [{ required: true, message: '请选择交易类型', trigger: 'change' }],
    payType: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
    amount: [
        { required: true, message: '请输入金额', trigger: 'blur' },
        {
            validator: (_, value) => value !== 0,
            message: '金额不能为0',
            trigger: 'blur'
        }
    ],
    tradeDate: [{ required: true, message: '请选择交易时间', trigger: 'change' }]
}

// 账单分类
const tradeTypeOptions = [
    { value: '早餐', label: '早餐' },
    { value: '中餐', label: '中餐' },
    { value: '晚餐', label: '晚餐' },
    { value: '买菜', label: '买菜' },
    { value: '零食', label: '零食' },
    { value: '饮用水', label: '饮用水' },
    { value: '聚餐', label: '聚餐' },

    { value: '基金买入', label: '基金买入' },
    { value: '基金卖出', label: '基金卖出' },
    { value: '黄牛支出', label: '黄牛支出' },
    { value: '黄牛收入', label: '黄牛收入' },

    { value: '电瓶车', label: '电瓶车' },
    { value: '支出', label: '支出' },
    { value: '收入', label: '收入' },

    { value: '房租', label: '房租' },
    { value: '水费', label: '水费' },
    { value: '电费', label: '电费' },
    { value: '燃气费', label: '燃气费' },
    { value: '话费', label: '话费' },

    { value: '会员支出', label: '会员支出' },
    { value: '公共交通', label: '公共交通' },
    { value: '打车费', label: '打车费' },

    { value: '书', label: '书' },
    { value: '日用品', label: '日用品' },
    { value: '药品', label: '药品' },
    { value: '衣服', label: '衣服' },
    { value: '鞋子', label: '鞋子' },
    { value: '箱包', label: '箱包' },
    
    { value: '医院', label: '医院' },
    { value: '配件', label: '配件' },
    { value: '眼镜', label: '眼镜' },
    { value: '数码电器', label: '数码电器' },


    { value: '游戏充值', label: '游戏充值' },
    { value: '旅游支出', label: '旅游支出' },
    { value: '酒店', label: '酒店' },
    { value: '电影', label: '电影' },
    { value: '网咖', label: '网咖' },
    { value: '按摩', label: '按摩' },
    
    { value: '红包', label: '红包' },
    { value: '快递', label: '快递' },

    { value: '取款', label: '取款' },
    { value: '存款', label: '存款' },
    { value: '借款', label: '借款' },
    { value: '还款', label: '还款' },
    { value: '返利', label: '返利' },
    { value: '礼品', label: '礼品' },
    { value: '理发', label: '理发' },


    { value: '驾照', label: '驾照' },
    { value: '退税', label: '退税' },
    { value: '公积金提现', label: '公积金提现' },
    
]
// 支付方式
const payTypeOptions = [
    { value: '微信1', label: '微信1' },
    { value: '支付宝1', label: '支付宝1' },
    { value: '花呗1', label: '花呗1' },
    { value: '京东白条', label: '京东白条' },
    { value: '同花顺', label: '同花顺' },
    { value: '民生银行信用卡(6707)', label: '民生银行信用卡(6707)' },
    { value: '光大银行储蓄卡(3807)', label: '光大银行储蓄卡(3807)' },
    { value: '招商银行信用卡(5295)', label: '招商银行信用卡(5295)' },
    { value: '招商银行储蓄卡(8616)', label: '招商银行储蓄卡(8616)' },
    { value: '工商银行储蓄卡(3572)', label: '工商银行储蓄卡(3572)' },
    { value: '建设银行储蓄卡(0309)', label: '建设银行储蓄卡(0309)' },
    { value: '农业银行储蓄卡(9571)', label: '农业银行储蓄卡(9571)' },
    { value: '邮储银行储蓄卡(5275)', label: '邮储银行储蓄卡(5275)' },
    { value: '京东小金库', label: '京东小金库' },
    { value: '支付宝2', label: '支付宝2' },
    { value: '花呗2', label: '花呗2' },
    { value: '微信2', label: '微信2' },
    { value: '微信3', label: '微信3' },
    { value: '抖音支付', label: '抖音支付' },
    
]

// 控制抽屉显示
const drawerVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

// 处理单元格点击 只做新增
const handleCellClick = async (dateString: string) => {
    try {
        resetForm()
        formData.tradeDate = `${dateString} 00:00:00`
        // 显示抽屉
        drawerVisible.value = true
    } catch (error) {
        console.error('获取数据失败', error)
    }
}
// 提交表单
const handleSubmit = async () => {
    try {
        await formRef.value?.validate()
        submitting.value = true

        const url = '/saveBill'
        const method = formData.id ? 'put' : 'post'

        console.log(JSON.stringify(formData, null, 2));

        const response = await http.post(url, formData)

        console.log(response);

        ElMessage.success('创建成功')
        drawerVisible.value = false
        // 刷新日历数据
        fetchBillData()
    } catch (error) {
        console.error('提交失败', error)
    } finally {
        submitting.value = false
    }
}

// 重置表单
const resetForm = () => {
    Object.assign(formData, {
        id: undefined,
        tradeType: undefined,
        payType: undefined,
        amount: 0,
        tradeDate: '',
        rmk: ''
    })
}

// 关闭抽屉处理
const handleDrawerClose = (done: () => void) => {
    if (formData.id || formData.amount !== 0) {
        ElMessageBox.confirm('有未保存的修改，确定关闭吗？')
            .then(() => {
                resetForm()
                done()
            })
            .catch(() => { })
    } else {
        resetForm()
        done()
    }
}


</script>



<style scoped>
.custom-cell {
    height: 100%;
    padding: 8px;
    display: flex;
    flex-direction: column;
}

.day-number {
    font-weight: bold;
    margin-bottom: 4px;
}

.amount {
    font-size: 0.9em;
    flex-grow: 1;
}

.positive {
    color: #C80000;
}

.negative {
    color: #008000;
}

/* 加载状态样式 */
:deep(.el-calendar__body) {
    position: relative;
}

:deep(.el-calendar__body):after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.7);
    display: none;
}

:deep(.el-calendar__body).loading:after {
    display: block;
}


.detail-tooltip {
    position: fixed;
    z-index: 9999;
    background: white;
    border-radius: 6px;
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.15);
    padding: 12px;
    font-size: 13px;
    pointer-events: none;
    width: 420px;
    max-width: 90vw;
}

.tooltip-header {
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 6px;
}

.detail-list {
    max-height: 200px;
    overflow-y: auto;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid #f5f5f5;
}

.detail-item:last-child {
    border-bottom: none;
}

.time {
    color: #666;
}

.detail-amount {
    font-weight: 500;
}

.tooltip-footer {
    margin-top: 8px;
    padding-top: 8px;
    font-weight: 500;
    color: #333;
    border-top: 1px solid #eee;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.table-container {
    max-height: 400px;
    overflow-y: auto;
}

.detail-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

th {
    background: #f8f9fa;
    color: #666;
    font-weight: 500;
    padding: 8px 12px;
    text-align: left;
    position: sticky;
    top: 0;
    z-index: 1;
}

td {
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: top;
}

.time-col {
    width: 15%;
}

.amount-col {
    width: 15%;
}

.type-col {
    width: 15%;
}

.remark-col {
    width: 40%;
}

.table-row:hover {
    background-color: #fafafa;
}

.type-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
}

.pay-type {
    background: #ecf5ff;
    color: #409eff;
    border: 1px solid #d9ecff;
}

.trade-type {
    background: #f0f9eb;
    color: #67c23a;
    border: 1px solid #e1f3d8;
}

.remark {
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}
</style>