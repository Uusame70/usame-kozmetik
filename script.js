const supabaseUrl = 'https://nrhjosjmhzsshlpcarjb.supabase.co';
const supabaseKey = 'sb_publishable_0Hnj8vv3VPNls6bYXYayhQ_0NLCk8Ml';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let urunler = [];
let sepet = [];
let isAdmin = false;

document.addEventListener('DOMContentLoaded', async () => {
    const kayitliSepet = localStorage.getItem('magaza_sepet');
    if (kayitliSepet) {
        sepet = JSON.parse(kayitliSepet);
    }

    await urunleriGetir();
    sepetiGuncelle();

    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.altKey && (e.key === 'M' || e.key === 'm')) {
            document.getElementById('login-modal').style.display = 'flex';
        }
    });
});

async function urunleriGetir() {
    const { data, error } = await supabase.from('urunler').select('*');
    
    if (error) {
        console.error("خطأ في جلب البيانات:", error);
        return;
    }
    
    urunler = data || [];
    urunleriEkranaBas();
}

async function kaydetUrun(editId, ad, fiyat, aciklama, resimler) {
    const btn = document.getElementById('btn-urun-kaydet');
    btn.innerText = "جاري الحفظ...";
    btn.disabled = true;

    if (editId) {
        const { error } = await supabase.from('urunler')
            .update({ ad: ad, fiyat: fiyat, aciklama: aciklama, resimler: resimler })
            .eq('id', editId);
            
        if (error) alert("خطأ في التحديث: " + error.message);
        else alert("تم تحديث المنتج بنجاح!");
    } else {
        const { error } = await supabase.from('urunler')
            .insert([{ ad: ad, fiyat: fiyat, aciklama: aciklama, resimler: resimler }]);
            
        if (error) alert("خطأ في الإضافة: " + error.message);
        else alert("تم إضافة المنتج بنجاح!");
    }

    btn.innerText = "إضافة المنتج";
    btn.disabled = false;
    
    formSifirla();
    await urunleriGetir();
}

async function urunSil(id) {
    if(confirm("هل أنت متأكد من رغبتك في حذف هذا المنتج؟")) {
        const { error } = await supabase.from('urunler').delete().eq('id', id);
        
        if (error) alert("خطأ في الحذف: " + error.message);
        else await urunleriGetir();
    }
}

function urunleriEkranaBas() {
    const grid = document.getElementById('urun-listesi');
    grid.innerHTML = '';

    urunler.forEach((u) => {
        const displayAdmin = isAdmin ? 'flex' : 'none';
        const ilkResim = u.resimler && u.resimler.length > 0 
            ? u.resimler[0] 
            : 'https://via.placeholder.com/300x400/1e293b/38bdf8?text=No+Image';

        const card = `
            <div class="product-card" onclick="urunDetayAc(${u.id})">
                <div class="image-box">
                    <img src="${ilkResim}" alt="${u.ad}">
                </div>
                <div class="info-box">
                    <div>
                        <h3>${u.ad}</h3>
                    </div>
                    <div>
                        <p class="price">${u.fiyat} ليرة</p>
                        <button type="button" onclick="event.stopPropagation(); sepeteEkle(${u.id})">إضافة إلى السلة</button>
                        <div class="admin-actions" style="display:${displayAdmin};">
                            <button type="button" class="edit-btn" onclick="event.stopPropagation(); urunDuzenleForm(${u.id})">تعديل</button>
                            <button type="button" class="delete-btn" onclick="event.stopPropagation(); urunSil(${u.id})">حذف</button>
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

    document.getElementById('detail-main-img').src = urun.resimler[0] || '';
    document.getElementById('detail-title').innerText = urun.ad;
    document.getElementById('detail-price').innerText = urun.fiyat + " ليرة";
    document.getElementById('detail-desc').innerText = urun.aciklama || "لا يوجد وصف متوفر.";

    const thumbsContainer = document.getElementById('detail-thumbs');
    thumbsContainer.innerHTML = '';

    if (urun.resimler && urun.resimler.length > 1) {
        urun.resimler.forEach(src => {
            thumbsContainer.innerHTML += `<img src="${src}" onclick="document.getElementById('detail-main-img').src='${src}'">`;
        });
    }

    const addBtn = document.getElementById('detail-add-cart-btn');
    addBtn.onclick = function() {
        sepeteEkle(urun.id);
        modalKapat('detail-modal');
    };

    document.getElementById('detail-modal').style.display = 'flex';
}

function sepeteEkle(id) {
    const varOlanUrun = sepet.find(item => item.id === id);
    
    if (varOlanUrun) {
        varOlanUrun.adet += 1;
    } else {
        const urun = urunler.find(u => u.id === id);
        if (urun) {
            sepet.push({ ...urun, adet: 1 });
        }
    }

    localStorage.setItem('magaza_sepet', JSON.stringify(sepet));
    sepetiGuncelle();
    alert("تمت إضافة المنتج إلى السلة!");
}

function sepetiGuncelle() {
    const toplamAdet = sepet.reduce((sum, item) => sum + item.adet, 0);
    const toplamFiyat = sepet.reduce((sum, item) => sum + (item.fiyat * item.adet), 0);

    document.getElementById('sepet-sayi').innerText = toplamAdet;
    document.getElementById('toplam-fiyat').innerText = toplamFiyat;
    document.getElementById('sepet-modal-toplam').innerText = toplamFiyat + " ليرة";
}

function sepetiAc() {
    const icerik = document.getElementById('sepet-icerik');
    icerik.innerHTML = '';

    if (sepet.length === 0) {
        icerik.innerHTML = '<p style="text-align:center; color:#94a3b8;">سلة التسوق فارغة.</p>';
    } else {
        sepet.forEach((u) => {
            const ilkResim = u.resimler && u.resimler.length > 0 ? u.resimler[0] : '';
            const itemHtml = `
                <div class="cart-item">
                    <img src="${ilkResim}" alt="${u.ad}">
                    <div class="cart-item-info">
                        <h4>${u.ad}</h4>
                        <p>${u.fiyat} ليرة × ${u.adet} = <b>${u.fiyat * u.adet} ليرة</b></p>
                    </div>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="adetDegistir(${u.id}, -1)">-</button>
                        <span style="font-weight:bold;">${u.adet}</span>
                        <button class="qty-btn" onclick="adetDegistir(${u.id}, 1)">+</button>
                    </div>
                    <i class="fa-solid fa-trash" style="color:#ef4444; cursor:pointer;" onclick="sepettenTamamenSil(${u.id})"></i>
                </div>
            `;
            icerik.innerHTML += itemHtml;
        });
    }

    document.getElementById('cart-modal').style.display = 'flex';
}

function adetDegistir(id, degisim) {
    const item = sepet.find(i => i.id === id);
    if (item) {
        item.adet += degisim;
        if (item.adet <= 0) {
            sepet = sepet.filter(i => i.id !== id);
        }
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

function sepetiKapat() { 
    document.getElementById('cart-modal').style.display = 'none'; 
}

function sepetiTemizle() {
    sepet = [];
    localStorage.removeItem('magaza_sepet');
    sepetiGuncelle();
    sepetiAc();
}

function siparisVer() {
    if(sepet.length === 0) {
        alert("سلتك فارغة!");
        return;
    }
    alert("تم استلام طلبك بنجاح! شكراً لك.");
    sepetiTemizle();
    sepetiKapat();
}

function modalKapat(id) { 
    document.getElementById(id).style.display = 'none'; 
}

function adminGirisYap() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (user === "usame" && pass === "1u2u3u4u5u.U") {
        alert("تم تسجيل الدخول بنجاح!");
        isAdmin = true;
        modalKapat('login-modal');
        document.getElementById('admin-panel').style.display = 'block';
        urunleriEkranaBas();
    } else {
        alert("اسم المستخدم أو كلمة المرور غير صحيحة!");
    }
}

function yeniUrunEkle() {
    const editId = document.getElementById('edit-urun-id').value;
    const ad = document.getElementById('yeni-ad').value;
    const fiyat = parseInt(document.getElementById('yeni-fiyat').value);
    const aciklama = document.getElementById('yeni-aciklama').value;
    const resimInput = document.getElementById('yeni-resim-files');

    if(!ad || !fiyat) {
        alert("يرجى ملء حقول اسم المنتج والسعر!");
        return;
    }

    let files = Array.from(resimInput.files);

    if (files.length === 0 && editId) {
        const mevcutUrun = urunler.find(u => u.id == editId);
        kaydetUrun(editId, ad, fiyat, aciklama, mevcutUrun.resimler);
        return;
    }

    if(files.length === 0 && !editId) {
        alert("يرجى اختيار صورة واحدة على الأقل!");
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
    const urun = urunler.find(u => u.id === id);
    if (!urun) return;

    document.getElementById('edit-urun-id').value = urun.id;
    document.getElementById('yeni-ad').value = urun.ad;
    document.getElementById('yeni-fiyat').value = urun.fiyat;
    document.getElementById('yeni-aciklama').value = urun.aciklama || '';
    
    document.getElementById('form-baslik').innerText = "✏️ لوحة التحكم: تعديل المنتج";
    document.getElementById('btn-urun-kaydet').innerText = "تحديث";
    document.getElementById('btn-iptal').style.display = "inline-block";

    document.getElementById('admin-panel').scrollIntoView({ behavior: 'smooth' });
}

function formSifirla() {
    document.getElementById('edit-urun-id').value = '';
    document.getElementById('yeni-ad').value = '';
    document.getElementById('yeni-fiyat').value = '';
    document.getElementById('yeni-aciklama').value = '';
    document.getElementById('yeni-resim-files').value = '';

    document.getElementById('form-baslik').innerText = "🛠️ لوحة التحكم: إضافة منتج جديد";
    document.getElementById('btn-urun-kaydet').innerText = "إضافة المنتج";
    document.getElementById('btn-iptal').style.display = "none";
}