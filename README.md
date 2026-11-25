# Mirror Lake

Mirror Lake; aynaları çevirerek ışığı nilüferlere ulaştırdığınız, mobil odaklı bir ışık ve yansıma bulmaca oyunudur. Oyun; renk değiştiren prizmalar, sıralı Ay Rünleri, portallar, bağlı ve hareketli aynalar, tek yönlü kapılar, Ay Mühürleri ve giderek büyüyen oyun alanları içeren 500 farklı bölüm sunar.

## Gereksinimler

- Node.js 22 veya üzeri
- Expo hesabı
- Mobil test için Expo Go veya development build

## Kurulum

```powershell
npm.cmd install
npx.cmd expo start --clear
```

## Expo Go ile test

Terminalde oluşan QR kodunu Expo Go ile okutun. Bilgisayar ve telefon aynı ağda değilse:

```powershell
npx.cmd expo start --tunnel --clear
```

## TestFlight / App Store hazırlığı

```powershell
npx.cmd --yes eas-cli@latest login
npx.cmd --yes eas-cli@latest build --platform ios --profile production
npx.cmd --yes eas-cli@latest submit --platform ios --profile production --latest
```

## Gizlilik ve depo güvenliği

Gerçek erişim anahtarlarını, Apple sertifikalarını, provisioning profillerini, EAS tokenlarını veya `.env` dosyalarını repoya eklemeyin. Gerekirse yalnızca örnek değerler içeren `.env.example` kullanın. Yerel build çıktıları, test ekran görüntüleri ve mağaza dışa aktarımları `.gitignore` ile hariç tutulmuştur.

## Lisans

Bu proje açık kaynak değildir. Kod, bölüm verileri, marka, görsel ve ses varlıklarının tüm hakları Görsen Games'e aittir. Ayrıntılar için [LICENSE](./LICENSE) dosyasına bakın.
