import { Router, type IRouter } from "express";
import type { Request } from "express";
import { db, contractsTable, userConsentsTable, userSessionsTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

async function requireAdmin(req: Request): Promise<{ id: number; role: string } | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  const now = new Date();
  const [session] = await db
    .select()
    .from(userSessionsTable)
    .where(and(eq(userSessionsTable.token, token), gt(userSessionsTable.expiresAt, now)));
  if (!session) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user || user.role !== "admin") return null;
  return { id: user.id, role: user.role };
}

const router: IRouter = Router();

const DEFAULT_CONTRACTS = [
  {
    key: "terms",
    title: "Kullanım Koşulları",
    content: `TAŞIYO LOJİSTİK PLATFORMU KULLANIM KOŞULLARI

Son Güncelleme: 2024

1. GENEL HÜKÜMLER
TaşıYo Lojistik Platformu ("Platform"), yük sahiplerini ve taşıyıcıları bir araya getiren dijital bir lojistik aracılık hizmetidir. Bu Kullanım Koşulları ("Koşullar"), Platform'u kullanan tüm kullanıcılar için geçerlidir.

2. TARAFLAR
İşbu sözleşme, TaşıYo Lojistik A.Ş. ("TaşıYo") ile Platform'a kayıt olan kullanıcı ("Kullanıcı") arasında akdedilmiştir.

3. KULLANIM KOŞULLARI
3.1. Platform'u kullanmak için en az 18 yaşında olmanız veya yasal temsilcinizin onayına sahip olmanız gerekmektedir.
3.2. Kayıt sırasında verilen bilgiler eksiksiz ve doğru olmalıdır.
3.3. Hesap güvenliğinizden siz sorumlusunuz. Şifrenizi kimseyle paylaşmayınız.
3.4. Platform üzerinden gerçekleştirilen işlemler Türk Ticaret Kanunu ve ilgili mevzuat hükümlerine tabidir.

4. YASAKLANAN FAALİYETLER
Kullanıcılar aşağıdaki faaliyetlerde bulunamaz:
- Sahte ilan veya teklif oluşturmak
- Başka kullanıcıları yanıltmak
- Platform altyapısına zarar vermek
- İlgili mevzuata aykırı taşımacılık faaliyetinde bulunmak

5. HİZMET BEDELİ VE ÖDEME
5.1. Platform ücretsiz üyelik imkânı sunmakla birlikte belirli hizmetler için ücret talep edebilir.
5.2. Ödemeler, Platform'un belirlediği koşullar çerçevesinde gerçekleştirilir.

6. FİKRİ MÜLKİYET
Platform'a ait tüm içerikler, tasarım unsurları ve yazılımlar TaşıYo'nun mülkiyetindedir ve izinsiz kullanılamaz.

7. SORUMLULUĞUN SINIRLANDIRILMASI
TaşıYo, kullanıcılar arasında gerçekleşen anlaşmazlıklarda arabulucu konumunda olup kargo hasarı ve gecikmelerden doğrudan sorumlu tutulamaz.

8. SÖZLEŞMENİN FESHİ
TaşıYo, bu Koşullar'ı ihlal eden kullanıcıların hesabını bildirimde bulunmaksızın askıya alabilir veya silebilir.

9. UYGULANACAK HUKUK
Bu Koşullar Türk Hukuku'na tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.

10. İLETİŞİM
Sorularınız için: destek@tasiyo.com`,
    version: 1,
  },
  {
    key: "privacy",
    title: "Gizlilik Politikası ve KVKK Aydınlatma Metni",
    content: `GİZLİLİK POLİTİKASI VE KİŞİSEL VERİLERİN KORUNMASI HAKKINDA AYDINLATMA METNİ

6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) Kapsamında

Veri Sorumlusu: TaşıYo Lojistik A.Ş.

1. VERİ SORUMLUSUNUN KİMLİĞİ
TaşıYo Lojistik A.Ş. ("TaşıYo"), 6698 sayılı KVKK uyarınca veri sorumlusu sıfatıyla kişisel verilerinizi işlemektedir.

2. İŞLENEN KİŞİSEL VERİLER
Platform üzerinde aşağıdaki kişisel verileriniz işlenmektedir:
- Ad, soyad, e-posta adresi, telefon numarası
- Şirket bilgileri (kurumsal kullanıcılar için)
- Araç bilgileri (şoförler için)
- İşlem ve lojistik faaliyet kayıtları
- IP adresi ve oturum bilgileri

3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI
Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
- Platform hizmetlerinin sunulması
- Hesap oluşturma ve doğrulama işlemleri
- Müşteri hizmetleri
- Yasal yükümlülüklerin yerine getirilmesi
- Güvenlik ve doğrulama süreçleri

4. KİŞİSEL VERİLERİN AKTARILMASI
Kişisel verileriniz; yasal zorunluluklar, iş ortaklarımız ve hizmet sağlayıcılarımızla sınırlı olmak üzere paylaşılabilir. Yurt dışına veri aktarımı gerçekleştirilmemektedir.

5. VERİ SAKLAMA SÜRESİ
Kişisel verileriniz, işlenme amacının ortadan kalkmasına kadar ve yasal saklama süreleri boyunca muhafaza edilir.

6. VERİ SAHİBİNİN HAKLARI (KVKK Madde 11)
KVKK kapsamında aşağıdaki haklara sahipsiniz:
- Kişisel verilerinizin işlenip işlenmediğini öğrenme
- İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
- Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme
- Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme
- Kişisel verilerin silinmesini veya yok edilmesini isteme
- Otomatik sistemler ile analiz edilmesi nedeniyle aleyhine çıkan sonuca itiraz etme
- Kişisel verilerin kanuna aykırı işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme

7. HAKLARINIZI KULLANMA
Haklarınızı kullanmak için: kvkk@tasiyo.com adresine yazılı başvurabilirsiniz.

8. ÇEREZLERİN KULLANIMI
Platform, hizmet kalitesini artırmak amacıyla çerezler kullanmaktadır. Çerez politikamız için çerez aydınlatma metnimizi inceleyiniz.`,
    version: 1,
  },
  {
    key: "distance_sales",
    title: "Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu",
    content: `MESAFELİ SATIŞ SÖZLEŞMESİ VE ÖN BİLGİLENDİRME FORMU

6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği Kapsamında

SATICI BİLGİLERİ
Unvan: TaşıYo Lojistik A.Ş.
E-posta: destek@tasiyo.com

1. KONU VE KAPSAM
Bu sözleşme, TaşıYo Lojistik Platformu üzerinden sunulan lojistik aracılık hizmetlerine ilişkin Satıcı ile Alıcı arasındaki hak ve yükümlülükleri düzenlemektedir.

2. HİZMET BİLGİLERİ
2.1. Platform üzerinden sunulan hizmetler dijital nitelikte olup hizmetin ifasına başlanması kullanıcının açık onayına bağlıdır.
2.2. Hizmet bedelleri, ilgili hizmet sayfasında açıkça belirtilmektedir.
2.3. Ödeme, kredi kartı, banka havalesi veya Platform'un sunduğu diğer ödeme yöntemleriyle gerçekleştirilebilir.

3. CAYMA HAKKI
3.1. Mesafeli sözleşmelerde 14 günlük cayma hakkı bulunmaktadır.
3.2. Ancak, dijital içerik ve hizmetlerin ifasına alıcının onayıyla başlanmış olması halinde cayma hakkı kullanılamaz.
3.3. Cayma hakkı bildirimi için: destek@tasiyo.com adresine yazılı bildirim yapılması gerekmektedir.

4. ÖDEME VE TESLİMAT
4.1. Platform üzerindeki hizmet bedellerinin tamamı ödeme anında tahsil edilir.
4.2. Lojistik hizmetlere ilişkin taşıma süreleri ve koşulları, ilgili ilan sayfasında belirtilmektedir.

5. UYUŞMAZLIK ÇÖZÜMÜ
5.1. Uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
5.2. Şikayet ve başvurular için: Tüketici Bilgi Sistemi (TÜBİS) kullanılabilir.

6. KİŞİSEL VERİLERİN KORUNMASI
Sözleşme kapsamında işlenen kişisel verileriniz, Gizlilik Politikası ve KVKK Aydınlatma Metni çerçevesinde korunmaktadır.

Bu sözleşmeyi onaylayarak yukarıda belirtilen koşulları okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz.`,
    version: 1,
  },
  {
    key: "marketing",
    title: "Ticari Elektronik İleti Onay Metni",
    content: `TİCARİ ELEKTRONİK İLETİ ONAY METNİ

6563 Sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun Kapsamında

TaşıYo Lojistik A.Ş. tarafından tarafıma e-posta, SMS ve anlık bildirim kanalları aracılığıyla;
- Kampanya ve indirim duyuruları
- Yeni hizmet ve özellik bildirimleri
- Platform haberleri ve güncellemeleri
- Kişiselleştirilmiş teklifler

içeren ticari elektronik iletilerin gönderilmesine onay veriyorum.

Bu onayı dilediğim zaman, her iletideki abonelik iptal bağlantısından veya destek@tasiyo.com adresine yazarak geri alabilirim.`,
    version: 1,
  },
  {
    key: "location",
    title: "Konum Verisi İşleme Onay Metni",
    content: `KONUM VERİSİ İŞLEME AYDINLATMA VE RIZA METNİ

KVKK Kapsamında Özel Nitelikli Kişisel Veri İşleme Aydınlatması

TaşıYo Lojistik A.Ş. olarak, taşıma ve lojistik hizmetlerinin daha etkin sunulabilmesi amacıyla konum verilerinizi işlemek istiyoruz.

İŞLEME AMACI
- Gerçek zamanlı araç ve yük takibi
- Yakın bölgedeki ilanların gösterilmesi
- Teslim/tesellüm konum doğrulaması
- Sürüş güzergâhı optimizasyonu

RIZA KONUSU
Mobil uygulama ve web platformu aracılığıyla cihazınızın GPS konum verisinin; görev süresince Platform'a iletilmesine ve yukarıdaki amaçlarla işlenmesine izin veriyorum.

VERİNİN SAKLANMASI
Konum verileri, taşıma görevi tamamlandıktan sonra 90 gün süreyle saklanır, akabinde anonim hale getirilir.

GERİ ALMA
Bu rızayı dilediğim zaman uygulama ayarlarından veya destek@tasiyo.com adresine yazarak geri alabilirim. Rızanın geri alınması halinde konum tabanlı özellikler kısıtlanabilir.`,
    version: 1,
  },
];

async function seedContracts() {
  for (const c of DEFAULT_CONTRACTS) {
    const existing = await db
      .select({ id: contractsTable.id })
      .from(contractsTable)
      .where(eq(contractsTable.key, c.key));
    if (existing.length === 0) {
      await db.insert(contractsTable).values(c);
    }
  }
}

seedContracts().catch(console.error);

router.get("/contracts", async (_req, res): Promise<void> => {
  const rows = await db.select().from(contractsTable);
  res.json({ success: true, contracts: rows });
});

router.get("/contracts/stats", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) {
    res.status(403).json({ success: false, message: "Yetkisiz erişim." });
    return;
  }
  const rows = await db.select().from(userConsentsTable);
  const total = rows.length;
  res.json({
    success: true,
    stats: {
      terms: rows.filter((r) => r.termsAccepted).length,
      privacy: rows.filter((r) => r.privacyAccepted).length,
      distance_sales: rows.filter((r) => r.distanceSalesAccepted).length,
      marketing: rows.filter((r) => r.marketingConsent).length,
      location: rows.filter((r) => r.locationConsent).length,
      total,
    },
  });
});

router.get("/contracts/:key", async (req, res): Promise<void> => {
  const { key } = req.params;
  const [row] = await db.select().from(contractsTable).where(eq(contractsTable.key, key));
  if (!row) {
    res.status(404).json({ success: false, message: "Sözleşme bulunamadı." });
    return;
  }
  res.json({ success: true, contract: row });
});

router.put("/contracts/:key", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req);
  if (!admin) {
    res.status(403).json({ success: false, message: "Yetkisiz erişim." });
    return;
  }

  const { key } = req.params;
  const { content, title } = req.body as { content?: string; title?: string };

  if (!content && !title) {
    res.status(400).json({ success: false, message: "İçerik veya başlık gereklidir." });
    return;
  }

  const [existing] = await db.select().from(contractsTable).where(eq(contractsTable.key, key));
  if (!existing) {
    res.status(404).json({ success: false, message: "Sözleşme bulunamadı." });
    return;
  }

  const [updated] = await db
    .update(contractsTable)
    .set({
      ...(content !== undefined && { content }),
      ...(title !== undefined && { title }),
      version: existing.version + 1,
      updatedAt: new Date(),
    })
    .where(eq(contractsTable.key, key))
    .returning();

  res.json({ success: true, contract: updated });
});

export default router;
