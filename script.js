const supabaseUrl = 'https://nrhjosjmhzsshlpcarjb.supabase.co';
const supabaseKey = 'sb_publishable_0Hnj8vv3VPNls6bYXYayhQ_0NLCk8Ml';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let urunler = [];
let sepet = [];
let isAdmin = false;
let aktifDil = localStorage.getItem('magaza_dil') || 'ar'; // Varsayılan giriş: Arapça
let secilenDetayId = null;

const ceviriler = {
    ar: {
        cartLabel: "السلة",
        currency: "ليرة",
        heroTitle: "تشكيلة الموسم الجديد",
        settingsText: "الإعدادات",
        settingsTitle: "الإعدادات",
        langDesc: "اختر لغة التطبيق",
        close: "إغلاق",
        addCart: "إضافة إلى السلة",
        cartModalTitle: "🛍️ المنتجات في سلتك",
        totalLabel: "المجموع الكلي:",
        orderBtn: "إتمام الطلب",
        clearCart: "إفراغ السلة",
        loginTitle: "🔐 تسجيل دخول المشرف",
        loginBtn: "تسجيل الدخول",
        userPlaceholder: "اسم المستخدم",
        passPlaceholder: "كلمة المرور",
        adminTitle: "🛠️ لوحة التحكم: إضافة منتج جديد",
        adminAddBtn: "إضافة المنتج",
        adminEditBtn: "تعديل",
        adminUpdateBtn: "تحديث",
        adminDeleteBtn: "حذف",
        adminCancel: "إلغاء",
        namePlaceholder: "اسم المنتج",
        pricePlaceholder: "السعر",
        descPlaceholder: "وصف المنتج",
        fileLabel: "اختر الصور (الحد الأقصى 10):",
        msgAdded: "تمت إضافة المنتج إلى السلة!",
        msgUpdated: "تم تحديث المنتج بنجاح!",
        msgCreated: "تم إضافة المنتج بنجاح!",
        msgDeleted: "تم حذف المنتج بنجاح!",
        msgOrder: "تم استلام طلبك بنجاح! شكراً لك.",
        msgLogin: "تم تسجيل الدخول بنجاح!",
        msgLoginErr: "اسم المستخدم أو كلمة المرور غير صحيحة!",
        msgEmptyCart: "سلتك فارغة!",
        msgFillFields: "يرجى ملء حقول اسم المنتج والسعر!",
        msgSelectImg: "يرجى اختيار صورة واحدة على الأقل!",
        confirmDelete: "هل أنت متأكد من رغبتك في حذف هذا المنتج؟",
        emptyCartText: "سلة التسوق فارغة."
    },
    tr: {
        cartLabel: "Sepet",
        currency: "TL",
        heroTitle: "Yeni Sezon Koleksiyonu",
        settingsText: "Ayarlar",
        settingsTitle: "Ayarlar",
        langDesc: "Uygulama Dilini Seçin",
        close: "Kapat",
        addCart: "Sepete Ekle",
        cartModalTitle: "🛍️ Sepetinizdeki Ürünler",
        totalLabel: "Toplam Tutar:",
        orderBtn: "Siparişi Tamamla",
        clearCart: "Sepeti Temizle",
        loginTitle: "🔐 Admin Girişi",
        loginBtn: "Giriş Yap",
        userPlaceholder: "Kullanıcı Adı",
        passPlaceholder: "Şifre",
        adminTitle: "🛠️ Admin Paneli: Yeni Ürün Ekle",
        adminAddBtn: "Ürünü Ekle",
        adminEditBtn: "Düzenle",
        adminUpdateBtn: "Güncelle",
        adminDeleteBtn: "Sil",
        adminCancel: "İptal",
        namePlaceholder: "Ürün Adı",
        pricePlaceholder: "Fiyat",
        descPlaceholder: "Ürün Açıklaması",
        fileLabel: "Fotoğraflar Seç (Max 10):",
        msgAdded: "Ürün sepete eklendi!",
        msgUpdated: "Ürün başarıyla güncellendi!",
        msgCreated: "Yeni ürün başarıyla eklendi!",
        msgDeleted: "Ürün başarıyla silindi!",
        msgOrder: "Siparişiniz başarıyla alındı! Teşekkür ederiz.",
        msgLogin: "Giriş Başarılı! Admin moduna geçildi.",
        msgLoginErr: "Hatalı kullanıcı adı veya şifre!",
        msgEmptyCart: "Sepetiniz boş!",
        msgFillFields: "Lütfen Ürün Adı ve Fiyatı alanlarını doldurun!",
        msgSelectImg: "Lütfen en az 1 resim seçin!",
        confirmDelete: "Bu ürünü silmek istediğinize emin misiniz?",
        emptyCartText: "Sepetiniz boş."
    }
};

function bildirimGoster(mesaj) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color:#38bdf8;"></i> ${mesaj}`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
    dilUygula(aktifDil);

    const kayitliSepet = localStorage.getItem('magaza_sepet');
    if (kayitliSepet) sepet = JSON.parse(kayitliSepet);

    await urunleriGetir();
    sepetiGuncelle();

    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.altKey && (e.key === 'M' || e.key === 'm')) {
            document.getElementById('login-modal').style.display = 'flex';
        }
    });
});

function ayarlariAc() {
    document.getElementById('settings-modal').style.display = 'flex';
}

function diliDegistir(dil) {
    aktifDil = dil;
    localStorage.setItem('magaza_dil', dil);
    dilUygula(dil);
    modalKapat('settings-modal');
    urunleriEkranaBas();
    sepetiGuncelle();
}

function dilUygula(dil) {
    const t = ceviriler[dil];
    const root = document.getElementById('html-root');

    if (dil === 'ar') {
        root.setAttribute('lang', 'ar');
        root.setAttribute('dir', 'rtl');
        document.body.style.textAlign = 'right';
    } else {
        root.setAttribute('lang', 'tr');
        root.setAttribute('dir', 'ltr');
        document.body.style.textAlign = 'left';
    }

    document.getElementById('ui-settings-text').innerText = t.settingsText;
    document.getElementById('ui-cart-label').innerText = t.cartLabel;
    document.getElementById('ui-currency').innerText = t.currency;
    document.getElementById('ui-hero-title').innerText = t.heroTitle;
    document.getElementById('ui-settings-title').innerText = t.settingsTitle;
    document.getElementById('ui-lang-select-desc').innerText = t.langDesc;
    document.getElementById('ui-close-btn').innerText = t.close;
    document.getElementById('ui-detail-close').innerText = t.close;
    document.getElementById('ui-cart-close').innerText = t.close;
    document.getElementById('ui-login-close').innerText = t.close;
    document.getElementById('detail-add-cart-btn').innerText = t.addCart;
    document.getElementById('ui-cart-modal-title').innerText = t.cartModalTitle;
    document.getElementById('ui-total-label').innerText = t.totalLabel;
    document.getElementById('ui-order-btn').innerText = t.orderBtn;
    document.getElementById('ui-clear-cart').innerText = t.clearCart;
    document.getElementById('ui-login-title').innerText = t.loginTitle;
    document.getElementById('ui-login-btn').innerText = t.loginBtn;
    document.getElementById('username').placeholder = t.userPlaceholder;
    document.getElementById('password').placeholder = t.passPlaceholder;
    
    document.getElementById('yeni-ad').placeholder = t.namePlaceholder;
    document.getElementById('yeni-fiyat').placeholder = t.pricePlaceholder;
    document.getElementById('yeni-aciklama').placeholder = t.descPlaceholder;
    document.getElementById('ui-file-label').innerText = t.fileLabel;

    const editId = document.getElementById('edit-urun-id').value;
    if (editId) {
        document.getElementById('form-baslik').innerText = dil === 'ar' ? "✏️ لوحة التحكم: تعديل المنتج" : "✏️ Admin Paneli: Ürünü Düzenle";
        document.getElementById('btn-urun-kaydet').innerText = t.adminUpdateBtn;
    } else {
        document.getElementById('form-baslik').innerText = dil === 'ar' ? "🛠️ لوحة التحكم: إضافة منتج جديد" : "🛠️ Admin Paneli: Yeni Ürün Ekle";
        document.getElementById('btn-urun-kaydet').innerText = t.adminAddBtn;
    }
    document.getElementById('btn-iptal').innerText = t.adminCancel;

    document.querySelectorAll('.curr-text').forEach(el => el.innerText = t.currency);
}

async function urunleriGetir() {
    const { data, error } = await supabase.from('urunler').select('*');
    if (error) { console.error(error); return; }
    urunler = data || [];
    urunleriEkranaBas();
}

async function kaydetUrun(editId, ad, fiyat, aciklama, resimler) {
    const t = ceviriler[aktifDil];
    const btn = document.getElementById('btn-urun-kaydet');
    btn.innerText = aktifDil === 'ar' ? "جاري الحفظ..." : "Kaydediliyor...";
    btn.disabled = true;

    if (editId) {
        const { error } = await supabase.from('urunler').update({ ad, fiyat, aciklama, resimler }).eq('id', editId);
        if (error) bildirimGoster(error.message);
        else bildirimGoster(t.msgUpdated);
    } else {
        const { error } = await supabase.from('urunler').insert([{ ad, fiyat, aciklama, resimler }]);
        if (error) bildirimGoster(error.message);
        else bildirimGoster(t.msgCreated);
    }

    btn.disabled = false;
    formSifirla();
    await urunleriGetir();
}

async function urunSil(id) {
    const t = ceviriler[aktifDil];
    if(confirm(t.confirmDelete)) {
        const { error } = await supabase.from('urunler').delete().eq('id', id);
        if (error) bildirimGoster(error.message);
        else {
            bildirimGoster(t.msgDeleted);
            await urunleriGetir();
        }
    }
}

function urunleriEkranaBas() {
    const t = ceviriler[aktifDil];
    const grid = document.getElementById('urun-listesi');
    grid.innerHTML = '';

    urunler.forEach((u) => {
        const displayAdmin = isAdmin ? 'flex' : 'none';
        const ilkResim = u.resimler && u.resimler.length > 0 ? u.resimler[0] : 'https://via.placeholder.com/300x400/1e293b/38bdf8?text=No+Image';

        const card = `
            <div class="product-card" onclick="urunDetayAc(${u.id})">
                <div class="image-box"><img src="${ilkResim}" alt="${u.ad}"></div>
                <div class="info-box" style="text-align: ${aktifDil === 'ar' ? 'right' : 'left'};">
                    <div><h3>${u.ad}</h3></div>
                    <div>
                        <p class="price">${u.fiyat} ${t.currency}</p>
                        <button type="button" onclick="event.stopPropagation(); sepeteEkle(${u.id})">${t.addCart}</button>
                        <div class="admin-actions" style="display:${displayAdmin};">
                            <button type="button" class="edit-btn" onclick="event.stopPropagation(); urunDuzenleForm(${u.id})">${t.adminEditBtn}</button>
                            <button type="button" class="delete-btn" onclick="event.stopPropagation(); urunSil(${u.id})">${t.adminDeleteBtn}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += card;
    });
}

function urunDetayAc(id) {
    const urun = urunler.find(u => u.id === id);
    if (!urun) return;
    secilenDetayId = id;

    document.getElementById('detail-main-img').src = urun.resimler[0] || '';
    document.getElementById('detail-title').innerText = urun.ad;
    document.getElementById('detail-price').innerText = `${urun.fiyat} ${ceviriler[aktifDil].currency}`;
    document.getElementById('detail-desc').innerText = urun.aciklama || "";

    const thumbsContainer = document.getElementById('detail-thumbs');
    thumbsContainer.innerHTML = '';
    if (urun.resimler && urun.resimler.length > 1) {
        urun.resimler.forEach(src => {
            thumbsContainer.innerHTML += `<img src="${src}" onclick="document.getElementById('detail-main-img').src='${src}'">`;
        });
    }

    document.getElementById('detail-modal').style.display = 'flex';
}

function detaySepeteEkle() {
    if (secilenDetayId) {
        sepeteEkle(secilenDetayId);
        modalKapat('detail-modal');
    }
}

function sepeteEkle(id) {
    const t = ceviriler[aktifDil];
    const varOlanUrun = sepet.find(item => item.id === id);
    if (varOlanUrun) {
        varOlanUrun.adet += 1;
    } else {
        const urun = urunler.find(u => u.id === id);
        if (urun) sepet.push({ ...urun, adet: 1 });
    }

    localStorage.setItem('magaza_sepet', JSON.stringify(sepet));
    sepetiGuncelle();
    bildirimGoster(t.msgAdded);
}

function sepetiGuncelle() {
    const toplamAdet = sepet.reduce((sum, item) => sum + item.adet, 0);
    const toplamFiyat = sepet.reduce((sum, item) => sum + (item.fiyat * item.adet), 0);

    document.getElementById('sepet-sayi').innerText = toplamAdet;
    document.getElementById('toplam-fiyat').innerText = toplamFiyat;
    document.getElementById('sepet-modal-toplam').innerText = toplamFiyat;
}

function sepetiAc() {
    const t = ceviriler[aktifDil];
    const icerik = document.getElementById('sepet-icerik');
    icerik.innerHTML = '';

    if (sepet.length === 0) {
        icerik.innerHTML = `<p style="text-align:center; color:#94a3b8;">${t.emptyCartText}</p>`;
    } else {
        sepet.forEach((u) => {
            const ilkResim = u.resimler && u.resimler.length > 0 ? u.resimler[0] : '';
            icerik.innerHTML += `
                <div class="cart-item">
                    <img src="${ilkResim}" alt="${u.ad}">
                    <div class="cart-item-info" style="text-align: ${aktifDil === 'ar' ? 'right' : 'left'};">
                        <h4>${u.ad}</h4>
                        <p>${u.fiyat} ${t.currency} × ${u.adet} = <b>${u.fiyat * u.adet} ${t.currency}</b></p>
                    </div>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="adetDegistir(${u.id}, -1)">-</button>
                        <span style="font-weight:bold;">${u.adet}</span>
                        <button class="qty-btn" onclick="adetDegistir(${u.id}, 1)">+</button>
                    </div>
                    <i class="fa-solid fa-trash" style="color:#ef4444; cursor:pointer;" onclick="sepettenTamamenSil(${u.id})"></i>
                </div>
            `;
        });
    }
    document.getElementById('cart-modal').style.display = 'flex';
}

function adetDegistir(id, degisim) {
    const item = sepet.find(i => i.id === id);
    if (item) {
        item.adet += degisim;
        if (item.adet <= 0) sepet = sepet.filter(i => i.id !== id);
        localStorage.setItem('magaza_sepet', JSON.stringify(sepet));
        sepetiGuncelle();
        sepetiAc();
    }
}

function sepettenTamamenSil(id) {
    sepet = sepet.filter(i => i.id !== id);
    localStorage.setItem('magaza_sepet', JSON.stringify(sepet));
    sepetiGuncelle();
    sepetiAc();
}

function sepetiKapat() { document.getElementById('cart-modal').style.display = 'none'; }
function sepetiTemizle() {
    sepet = [];
    localStorage.removeItem('magaza_sepet');
    sepetiGuncelle();
    sepetiAc();
}

function siparisVer() {
    const t = ceviriler[aktifDil];
    if(sepet.length === 0) {
        bildirimGoster(t.msgEmptyCart);
        return;
    }
    bildirimGoster(t.msgOrder);
    sepetiTemizle();
    sepetiKapat();
}

function modalKapat(id) { document.getElementById(id).style.display = 'none'; }

function adminGirisYap() {
    const t = ceviriler[aktifDil];
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (user === "usame" && pass === "1u2u3u4u5u.U") {
        bildirimGoster(t.msgLogin);
        isAdmin = true;
        modalKapat('login-modal');
        document.getElementById('admin-panel').style.display = 'block';
        urunleriEkranaBas();
    } else {
        bildirimGoster(t.msgLoginErr);
    }
}

function yeniUrunEkle() {
    const t = ceviriler[aktifDil];
    const editId = document.getElementById('edit-urun-id').value;
    const ad = document.getElementById('yeni-ad').value;
    const fiyat = parseInt(document.getElementById('yeni-fiyat').value);
    const aciklama = document.getElementById('yeni-aciklama').value;
    const resimInput = document.getElementById('yeni-resim-files');

    if(!ad || !fiyat) {
        bildirimGoster(t.msgFillFields);
        return;
    }

    let files = Array.from(resimInput.files);
    if (files.length === 0 && editId) {
        const mevcutUrun = urunler.find(u => u.id == editId);
        kaydetUrun(editId, ad, fiyat, aciklama, mevcutUrun.resimler);
        return;
    }

    if(files.length === 0 && !editId) {
        bildirimGoster(t.msgSelectImg);
        return;
    }

    if(files.length > 10) files = files.slice(0, 10);

    const resimUrlDizisi = [];
    let okunanSayi = 0;

    files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resimUrlDizisi.push(e.target.result);
            okunanSayi++;
            if(okunanSayi === files.length) {
                kaydetUrun(editId, ad, fiyat, aciklama, resimUrlDizisi);
            }
        };
        reader.readAsDataURL(file);
    });
}

function urunDuzenleForm(id) {
    const t = ceviriler[aktifDil];
    const urun = urunler.find(u => u.id === id);
    if (!urun) return;

    document.getElementById('edit-urun-id').value = urun.id;
    document.getElementById('yeni-ad').value = urun.ad;
    document.getElementById('yeni-fiyat').value = urun.fiyat;
    document.getElementById('yeni-aciklama').value = urun.aciklama || '';
    
    document.getElementById('form-baslik').innerText = aktifDil === 'ar' ? "✏️ لوحة التحكم: تعديل المنتج" : "✏️ Admin Paneli: Ürünü Düzenle";
    document.getElementById('btn-urun-kaydet').innerText = t.adminUpdateBtn;
    document.getElementById('btn-iptal').style.display = "inline-block";

    document.getElementById('admin-panel').scrollIntoView({ behavior: 'smooth' });
}

function formSifirla() {
    const t = ceviriler[aktifDil];
    document.getElementById('edit-urun-id').value = '';
    document.getElementById('yeni-ad').value = '';
    document.getElementById('yeni-fiyat').value = '';
    document.getElementById('yeni-aciklama').value = '';
    document.getElementById('yeni-resim-files').value = '';

    document.getElementById('form-baslik').innerText = aktifDil === 'ar' ? "🛠️ لوحة التحكم: إضافة منتج جديد" : "🛠️ Admin Paneli: Yeni Ürün Ekle";
    document.getElementById('btn-urun-kaydet').innerText = t.adminAddBtn;
    document.getElementById('btn-iptal').style.display = "none";
}
