# Drift Zone — MacBook / PC (Web) Sürümü

Bu klasör, Android oyununun **tarayıcıda çalışan** sürümüdür. MacBook, Windows, Linux ve mobil
tarayıcılarda aynı oyunu oynayabilirsiniz. Oyun mantığı (motor, zorluk, skor) mobil sürümle
birebir aynıdır; çizim tarayıcının Canvas 2D API'siyle yapılır.

Bu sürüm **reklam geliri odaklıdır**:

| Reklam türü | Nerede gösterilir | Gelir etkisi |
| --- | --- | --- |
| Ödüllü video #1 | Oyun bitince "1 canla devam et" | En yüksek eCPM |
| Ödüllü video #2 | Oyun bitince "skoru 2 katına çıkar" | En yüksek eCPM |
| Geçiş reklamı | Her tur bitişinde otomatik (30 sn arayla) | Yüksek |
| Banner | Üst ve alt reklam alanları | Sürekli |

## Neden AdMob değil?

AdMob yalnızca **mobil uygulamalarda** çalışır. Web sayfasında veya masaüstü uygulamasında AdMob
reklamı yayınlamak Google politikalarına aykırıdır ve hesap kapatılır. Web'de aynı işi yapan
ürünler:

- **Google AdSense** → sayfa üstü/altı görüntülü reklamlar (banner)
- **Google H5 Games Ads** (AdSense'in oyun çözümü) → ödüllü ve geçiş reklamları

İkisi de AdMob ile **aynı Google hesabından** yönetilir ama ayrı başvuru gerektirir. AdMob
kimliği `ca-app-pub-...`, AdSense kimliği `ca-pub-...` biçimindedir.

## Reklamlar neden şu an görünmüyor? Kimlikleri nereden alacağım?

AdMob panelindeki `ca-app-pub-2909351126728508/...` gibi kimlikler **web'de kullanılamaz**; onlar
sadece mobil uygulama içindir. Web için gereken AdSense kimliği şu adımlarla alınır:

1. https://adsense.google.com adresine, AdMob ile aynı Google hesabıyla girin ve **site adresinizi**
   ekleyin. Site canlı olmalıdır; ücretsiz bir `*.netlify.app`, `*.vercel.app` veya `*.github.io`
   adresi de kabul edilir (domain satın almak zorunlu değildir).
2. Başvuru Google tarafından incelenir. Onay e-postası geldikten sonra panelde:
   **Hesap → Ayarlar → Hesap bilgileri → Yayıncı kimliği** alanındaki `pub-...` numarası sizin
   AdSense kimliğinizdir. Kodda `ca-pub-...` olarak kullanılır.
3. Aynı panelde **Reklamlar → Reklam birimleri → Reklam birimi ekleyin** ile iki adet görüntülü
   reklam birimi oluşturun. Her birimin `data-ad-slot` numarasını not edin.
4. Yayıncı kimliği (`ca-pub-2909351126728508`) koda ve `public/ads.txt` dosyasına tanımlıdır;
   AdSense panelindeki numara buysa değiştirmek gerekmez. Reklam birimlerinin slot numaralarını
   ortam değişkeni olarak ekleyip `npm run build` yapın:
   ```env
   VITE_ADSENSE_SLOT_TOP=ust_birim_slot_numarasi
   VITE_ADSENSE_SLOT_BOTTOM=alt_birim_slot_numarasi
   ```
5. Ödüllü ve geçiş reklamları için AdSense panelinde H5 Games Ads başvurusunun onaylanması
   gerekir; onaylanınca `.env` dosyasına `VITE_H5_GAMES_ADS=on` ekleyin.

Başvuru ve onay süreci Google'a aittir; bu adımlar sizin hesabınızdan yapılmalıdır. Kod tarafı
tamamen hazırdır: kimlikler girilip site yeniden derlendiğinde reklam alanları otomatik çalışır.

Alternatif: Kendi siteniz ve AdSense onayı istemiyorsanız, oyunu bir HTML5 oyun portalına
(GameDistribution, CrazyGames) yükleyip onların reklam SDK'sıyla gelir alabilirsiniz. Bu yolu
seçerseniz `AdGateway` arayüzüne portal SDK'sı eklenmesi yeterlidir.

## Hızlı başlangıç

```bash
npm install
npm run dev
```

Geliştirme sırasında reklam kimliği tanımlı değilse reklam alanlarında bilgi kutusu görünür;
oyun tam çalışır.

## Reklam kurulumu (gelir için şart)

1. **Siteyi yayına alın.** AdSense, başvurudan önce sitenin canlı bir alan adında olmasını ister
   (ör. `driftzone.example.com`). Aşağıdaki "Yayına alma" bölümüne bakın.
2. **AdSense hesabı açın** (AdMob'daki Google hesabıyla): https://adsense.google.com
   Site adresinizi ekleyin. Doğrulama kodunu ayrıca eklemeniz gerekmez; oyun, script'i yayıncı
   kimliğiyle birlikte otomatik yükler.
3. **Görüntülü reklam birimleri oluşturun:** AdSense → Reklamlar → Reklam birimi oluştur →
   Görüntülü. İki birim oluşturun (üst ve alt). Slot numaralarını kopyalayın.
4. **Ortam dosyasını doldurun:**
   ```bash
   cp .env.example .env
   ```
   ```env
   VITE_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
   VITE_ADSENSE_SLOT_TOP=ust_slot_numarasi
   VITE_ADSENSE_SLOT_BOTTOM=alt_slot_numarasi
   ```
   Not: AdSense kimliği (`ca-pub-...`) AdMob'daki `ca-app-pub-...` kimliğinden farklıdır. AdSense
   panelinde Hesap → Hesap bilgileri bölümünde yazan `ca-pub-...` değerini kullanın.
5. **H5 Games Ads başvurusu:** AdSense panelinde H5 oyun reklamları bölümünün görünür olması
   gerekir. Başvurunuz onaylandıktan sonra:
   ```env
   VITE_H5_GAMES_ADS=on
   ```
   Bu ayar açık olmadan ödüllü ve geçiş reklamları çalışmaz; banner geliri çalışmaya devam eder.
6. **Gizlilik ve mesajlaşma (CMP):** AdSense → Gizlilik ve mesajlaşma → GDPR mesajı oluşturun.
   Avrupa kullanıcıları için onay formu bu ayarla otomatik gösterilir.
7. **ads.txt:** `public/ads.txt` dosyasındaki `pub-...` numarasını AdSense panelinizdeki
   `ca-pub-...` numarasıyla güncelleyin (AdMob numarasıyla aynı olmayabilir). Dosya yayında
   `https://alanadiniz/ads.txt` adresinden erişilebilir olmalı.
8. **Gizlilik sayfası:** `privacy.html` içindeki e-posta alanını doldurun ve sayfayı sitede yayında
   tutun. AdSense başvurusunda bu sayfa istenir.
9. **Yeniden derleyip yayınlayın:** `npm run build`

### Test modu

Yayına almadan önce reklamların yerleşimini görmek için:

```env
VITE_ADSENSE_TEST=on
```

Bu modda Google test reklamları gösterilir ve **gelir işlemez**. Yayında mutlaka `off` olmalıdır.

## Yayına alma

`npm run build` sonrası `dist/` klasörü tamamen statiktir; herhangi bir statik hosting'e
yükleyebilirsiniz.

- **Netlify:** Site kökü bu klasör olsun; `netlify.toml` ayarları hazır. `dist` klasörünü
  https://app.netlify.com/drop adresine sürükleyip bırakmanız da yeterlidir.
- **Vercel:** `vercel` komutu veya GitHub entegrasyonu; `vercel.json` ayarları hazır.
- **Cloudflare Pages / GitHub Pages:** Build komutu `npm run build`, çıktı klasörü `dist`.
  (`base: './'` ayarı alt dizinlerde çalışmayı destekler.)
- **Kendi sunucunuz:** `dist` içeriğini HTTPS destekleyen bir alan adına kopyalayın. AdSense için
  HTTPS zorunludur.

## Reklam gelirini artırma (politikaya uygun)

- **Ödüllü reklamlar en değerlidir.** Oyuncular gönüllü izlediği için eCPM banner'ın kat kat
  üzerindedir. Bu projede iki ödüllü yerleşim var; ikisi de tur başına bir kez kullanılabilir.
- **Geçiş reklamı** her tur bitişinde denenir, 30 saniye arayla sınırlandırılır ve Google'ın
  kendi frekans sınırlarına tabidir.
- **Banner'lar** her zaman görünür; masaüstünde 728x90, mobilde responsive olarak boyutlanır.
- **Auto ads:** AdSense panelinden site bazında Auto ads'i açarak ek yerleşimler alabilirsiniz.
- **Trafik:** Reklam geliri oyuncu sayısıyla doğru orantılıdır. Oyunu itch.io, Newgrounds,
  CrazyGames gibi platformlarda da yayınlamak trafiği artırır. Bu platformların kendi reklam
  SDK'ları daha yüksek oyun eCPM'i verebilir; `src/services/ads.ts` içindeki `AdGateway` arayüzü
  sayesinde ileride kolayca değiştirilebilir.

### Politika uyarısı

Aşırı agresif reklam (oyun ortasında zorla tam ekran, içerik üstünü kapatan reklam, reklama
tıklamaya zorlama) Google hesabınızın askıya alınmasına yol açar ve tüm gelir durur. Bu projedeki
yerleşimler bilinçli olarak politika dostudur; ödüllü reklamları çoğaltmak isterseniz oyun içi
ödül karşılığı yeni yerleşimler ekleyin, zorla gösterim eklemeyin.

## Komutlar

```bash
npm run dev        # geliştirme sunucusu
npm run build      # üretim derlemesi (typecheck + vite build)
npm run preview    # derlenmiş sürümü yerel olarak önizle
npm run typecheck  # TypeScript kontrolü
npm test           # oyun motoru ve reklam politikası testleri
```

## Kontroller

- **Fare/dokunma:** Küreyi sürükleyerek hareket et
- **Çift tık / çift dokunma / Boşluk / C:** Renk değiştir
- **Ok tuşları / WASD:** Hareket
- **P:** Duraklat
- **Enter:** Menüde başlat, oyun bitince yeniden başlat

## Proje yapısı

```
src/game/          Oyun motoru (mobil sürümden; web'e ödüllü 2x skor eklendi)
src/services/ads.ts    AdSense banner + H5 Games Ads ödüllü/geçiş reklamları
src/services/audio.ts  Web Audio ile ses efektleri
src/services/storage.ts  localStorage rekor kaydı
src/renderer.ts    Canvas 2D çizim (Skia görünümünün birebir karşılığı)
src/ui.ts          HUD ve menü katmanları
src/main.ts        Oyun döngüsü, girdi ve reklam akışları
```
