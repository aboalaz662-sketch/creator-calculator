const platformInput = document.getElementById('platform');
const nicheInput = document.getElementById('niche');
const viewsInput = document.getElementById('views');
const viewsValue = document.getElementById('views-value');
const investmentInput = document.getElementById('investment');
const monthlyIncomeEl = document.getElementById('monthly-income');
const paybackPeriodEl = document.getElementById('payback-period');

// أسعار الـ RPM التقديرية لكل ألف مشاهدة حسب المنصة والمجال
const rpmData = {
    youtube: { tech: 4.0, gaming: 1.5, vlogs: 2.0 },
    tiktok: { tech: 0.5, gaming: 0.2, vlogs: 0.3 },
    instagram: { tech: 1.2, gaming: 0.5, vlogs: 0.8 }
};

function calculate() {
    const platform = platformInput.value;
    const niche = nicheInput.value;
    const views = parseFloat(viewsInput.value);
    const investment = parseFloat(investmentInput.value) || 0;

    viewsValue.textContent = views.toLocaleString('ar-EG') + ' مشاهدة';

    // جلب سعر الـ RPM
    const rpm = rpmData[platform][niche];
    const estimatedIncome = (views / 1000) * rpm;

    monthlyIncomeEl.textContent = '$' + estimatedIncome.toFixed(2);

    if (estimatedIncome > 0 && investment > 0) {
        const months = investment / estimatedIncome;
        paybackPeriodEl.textContent = months.toFixed(1) + ' أشهر';
    } else {
        paybackPeriodEl.textContent = 'غير محدد';
    }
}

platformInput.addEventListener('change', calculate);
nicheInput.addEventListener('change', calculate);
viewsInput.addEventListener('input', calculate);
investmentInput.addEventListener('input', calculate);

calculate();