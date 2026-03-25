--
-- PostgreSQL database dump
--

\restrict ptDGAfKcg0BFdV6qgWfIbmuv3A5zEoFCUo33YnQ3WZdCXkbMc0aA5zYuvbWtfue

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contracts (
    id integer NOT NULL,
    key text NOT NULL,
    title text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contracts_id_seq OWNED BY public.contracts.id;


--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_participants (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversation_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversation_participants_id_seq OWNED BY public.conversation_participants.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: loads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loads (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    origin text NOT NULL,
    destination text NOT NULL,
    distance real,
    weight real,
    load_type text NOT NULL,
    vehicle_type text NOT NULL,
    pricing_model text DEFAULT 'fixed'::text NOT NULL,
    price real,
    min_bid real,
    max_bid real,
    status text DEFAULT 'active'::text NOT NULL,
    is_premium boolean DEFAULT false,
    posted_by_id integer,
    offers_count integer DEFAULT 0,
    pickup_date timestamp with time zone,
    delivery_date timestamp with time zone,
    origin_lat real,
    origin_lng real,
    dest_lat real,
    dest_lng real,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: loads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: loads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loads_id_seq OWNED BY public.loads.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    body text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    type text DEFAULT 'system'::text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    related_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offers (
    id integer NOT NULL,
    load_id integer NOT NULL,
    driver_id integer NOT NULL,
    amount real NOT NULL,
    note text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: offers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.offers_id_seq OWNED BY public.offers.id;


--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_codes (
    id integer NOT NULL,
    identifier text NOT NULL,
    identifier_type text NOT NULL,
    code text NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: otp_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.otp_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: otp_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.otp_codes_id_seq OWNED BY public.otp_codes.id;


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text,
    label text NOT NULL,
    description text,
    "group" text DEFAULT 'general'::text NOT NULL,
    is_secret boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: platform_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.platform_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: platform_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.platform_settings_id_seq OWNED BY public.platform_settings.id;


--
-- Name: shipment_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipment_events (
    id integer NOT NULL,
    shipment_id integer NOT NULL,
    event text NOT NULL,
    description text,
    lat real,
    lng real,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shipment_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shipment_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shipment_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shipment_events_id_seq OWNED BY public.shipment_events.id;


--
-- Name: shipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipments (
    id integer NOT NULL,
    load_id integer NOT NULL,
    driver_id integer,
    status text DEFAULT 'pickup'::text NOT NULL,
    current_lat real,
    current_lng real,
    estimated_arrival timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shipments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shipments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shipments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shipments_id_seq OWNED BY public.shipments.id;


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subject text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    admin_id integer,
    admin_reply text,
    replied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.support_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: support_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.support_tickets_id_seq OWNED BY public.support_tickets.id;


--
-- Name: user_consents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_consents (
    id integer NOT NULL,
    user_id integer NOT NULL,
    terms_accepted boolean DEFAULT false NOT NULL,
    privacy_accepted boolean DEFAULT false NOT NULL,
    distance_sales_accepted boolean DEFAULT false NOT NULL,
    marketing_consent boolean DEFAULT false NOT NULL,
    location_consent boolean DEFAULT false NOT NULL,
    ip_address text,
    consent_timestamp timestamp with time zone DEFAULT now() NOT NULL,
    terms_version integer DEFAULT 1 NOT NULL,
    privacy_version integer DEFAULT 1 NOT NULL,
    distance_sales_version integer DEFAULT 1 NOT NULL
);


--
-- Name: user_consents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_consents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_consents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_consents_id_seq OWNED BY public.user_consents.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    role text DEFAULT 'individual'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    company text,
    avatar_url text,
    rating real DEFAULT 5,
    total_shipments integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    website text,
    address text,
    tax_number text,
    vehicle_types text,
    notification_settings text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: contracts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts ALTER COLUMN id SET DEFAULT nextval('public.contracts_id_seq'::regclass);


--
-- Name: conversation_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants ALTER COLUMN id SET DEFAULT nextval('public.conversation_participants_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: loads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loads ALTER COLUMN id SET DEFAULT nextval('public.loads_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: offers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);


--
-- Name: otp_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes ALTER COLUMN id SET DEFAULT nextval('public.otp_codes_id_seq'::regclass);


--
-- Name: platform_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings ALTER COLUMN id SET DEFAULT nextval('public.platform_settings_id_seq'::regclass);


--
-- Name: shipment_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_events ALTER COLUMN id SET DEFAULT nextval('public.shipment_events_id_seq'::regclass);


--
-- Name: shipments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments ALTER COLUMN id SET DEFAULT nextval('public.shipments_id_seq'::regclass);


--
-- Name: support_tickets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets ALTER COLUMN id SET DEFAULT nextval('public.support_tickets_id_seq'::regclass);


--
-- Name: user_consents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents ALTER COLUMN id SET DEFAULT nextval('public.user_consents_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contracts (id, key, title, content, version, updated_at) FROM stdin;
2	privacy	Gizlilik Politikası ve KVKK Aydınlatma Metni	GİZLİLİK POLİTİKASI VE KİŞİSEL VERİLERİN KORUNMASI HAKKINDA AYDINLATMA METNİ\n\n6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) Kapsamında\n\nVeri Sorumlusu: TaşıYo Lojistik A.Ş.\n\n1. VERİ SORUMLUSUNUN KİMLİĞİ\nTaşıYo Lojistik A.Ş. ("TaşıYo"), 6698 sayılı KVKK uyarınca veri sorumlusu sıfatıyla kişisel verilerinizi işlemektedir.\n\n2. İŞLENEN KİŞİSEL VERİLER\nPlatform üzerinde aşağıdaki kişisel verileriniz işlenmektedir:\n- Ad, soyad, e-posta adresi, telefon numarası\n- Şirket bilgileri (kurumsal kullanıcılar için)\n- Araç bilgileri (şoförler için)\n- İşlem ve lojistik faaliyet kayıtları\n- IP adresi ve oturum bilgileri\n\n3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI\nKişisel verileriniz aşağıdaki amaçlarla işlenmektedir:\n- Platform hizmetlerinin sunulması\n- Hesap oluşturma ve doğrulama işlemleri\n- Müşteri hizmetleri\n- Yasal yükümlülüklerin yerine getirilmesi\n- Güvenlik ve doğrulama süreçleri\n\n4. KİŞİSEL VERİLERİN AKTARILMASI\nKişisel verileriniz; yasal zorunluluklar, iş ortaklarımız ve hizmet sağlayıcılarımızla sınırlı olmak üzere paylaşılabilir. Yurt dışına veri aktarımı gerçekleştirilmemektedir.\n\n5. VERİ SAKLAMA SÜRESİ\nKişisel verileriniz, işlenme amacının ortadan kalkmasına kadar ve yasal saklama süreleri boyunca muhafaza edilir.\n\n6. VERİ SAHİBİNİN HAKLARI (KVKK Madde 11)\nKVKK kapsamında aşağıdaki haklara sahipsiniz:\n- Kişisel verilerinizin işlenip işlenmediğini öğrenme\n- İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme\n- Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme\n- Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme\n- Kişisel verilerin silinmesini veya yok edilmesini isteme\n- Otomatik sistemler ile analiz edilmesi nedeniyle aleyhine çıkan sonuca itiraz etme\n- Kişisel verilerin kanuna aykırı işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme\n\n7. HAKLARINIZI KULLANMA\nHaklarınızı kullanmak için: kvkk@tasiyo.com adresine yazılı başvurabilirsiniz.\n\n8. ÇEREZLERİN KULLANIMI\nPlatform, hizmet kalitesini artırmak amacıyla çerezler kullanmaktadır. Çerez politikamız için çerez aydınlatma metnimizi inceleyiniz.	1	2026-03-25 02:24:10.139073+00
3	distance_sales	Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu	MESAFELİ SATIŞ SÖZLEŞMESİ VE ÖN BİLGİLENDİRME FORMU\n\n6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği Kapsamında\n\nSATICI BİLGİLERİ\nUnvan: TaşıYo Lojistik A.Ş.\nE-posta: destek@tasiyo.com\n\n1. KONU VE KAPSAM\nBu sözleşme, TaşıYo Lojistik Platformu üzerinden sunulan lojistik aracılık hizmetlerine ilişkin Satıcı ile Alıcı arasındaki hak ve yükümlülükleri düzenlemektedir.\n\n2. HİZMET BİLGİLERİ\n2.1. Platform üzerinden sunulan hizmetler dijital nitelikte olup hizmetin ifasına başlanması kullanıcının açık onayına bağlıdır.\n2.2. Hizmet bedelleri, ilgili hizmet sayfasında açıkça belirtilmektedir.\n2.3. Ödeme, kredi kartı, banka havalesi veya Platform'un sunduğu diğer ödeme yöntemleriyle gerçekleştirilebilir.\n\n3. CAYMA HAKKI\n3.1. Mesafeli sözleşmelerde 14 günlük cayma hakkı bulunmaktadır.\n3.2. Ancak, dijital içerik ve hizmetlerin ifasına alıcının onayıyla başlanmış olması halinde cayma hakkı kullanılamaz.\n3.3. Cayma hakkı bildirimi için: destek@tasiyo.com adresine yazılı bildirim yapılması gerekmektedir.\n\n4. ÖDEME VE TESLİMAT\n4.1. Platform üzerindeki hizmet bedellerinin tamamı ödeme anında tahsil edilir.\n4.2. Lojistik hizmetlere ilişkin taşıma süreleri ve koşulları, ilgili ilan sayfasında belirtilmektedir.\n\n5. UYUŞMAZLIK ÇÖZÜMÜ\n5.1. Uyuşmazlıklarda Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.\n5.2. Şikayet ve başvurular için: Tüketici Bilgi Sistemi (TÜBİS) kullanılabilir.\n\n6. KİŞİSEL VERİLERİN KORUNMASI\nSözleşme kapsamında işlenen kişisel verileriniz, Gizlilik Politikası ve KVKK Aydınlatma Metni çerçevesinde korunmaktadır.\n\nBu sözleşmeyi onaylayarak yukarıda belirtilen koşulları okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz.	1	2026-03-25 02:24:10.143572+00
4	marketing	Ticari Elektronik İleti Onay Metni	TİCARİ ELEKTRONİK İLETİ ONAY METNİ\n\n6563 Sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun Kapsamında\n\nTaşıYo Lojistik A.Ş. tarafından tarafıma e-posta, SMS ve anlık bildirim kanalları aracılığıyla;\n- Kampanya ve indirim duyuruları\n- Yeni hizmet ve özellik bildirimleri\n- Platform haberleri ve güncellemeleri\n- Kişiselleştirilmiş teklifler\n\niçeren ticari elektronik iletilerin gönderilmesine onay veriyorum.\n\nBu onayı dilediğim zaman, her iletideki abonelik iptal bağlantısından veya destek@tasiyo.com adresine yazarak geri alabilirim.	1	2026-03-25 02:24:10.146527+00
5	location	Konum Verisi İşleme Onay Metni	KONUM VERİSİ İŞLEME AYDINLATMA VE RIZA METNİ\n\nKVKK Kapsamında Özel Nitelikli Kişisel Veri İşleme Aydınlatması\n\nTaşıYo Lojistik A.Ş. olarak, taşıma ve lojistik hizmetlerinin daha etkin sunulabilmesi amacıyla konum verilerinizi işlemek istiyoruz.\n\nİŞLEME AMACI\n- Gerçek zamanlı araç ve yük takibi\n- Yakın bölgedeki ilanların gösterilmesi\n- Teslim/tesellüm konum doğrulaması\n- Sürüş güzergâhı optimizasyonu\n\nRIZA KONUSU\nMobil uygulama ve web platformu aracılığıyla cihazınızın GPS konum verisinin; görev süresince Platform'a iletilmesine ve yukarıdaki amaçlarla işlenmesine izin veriyorum.\n\nVERİNİN SAKLANMASI\nKonum verileri, taşıma görevi tamamlandıktan sonra 90 gün süreyle saklanır, akabinde anonim hale getirilir.\n\nGERİ ALMA\nBu rızayı dilediğim zaman uygulama ayarlarından veya destek@tasiyo.com adresine yazarak geri alabilirim. Rızanın geri alınması halinde konum tabanlı özellikler kısıtlanabilir.	1	2026-03-25 02:24:10.149141+00
1	terms	Kullanım Koşulları	TAŞIYO LOJİSTİK PLATFORMU KULLANIM KOŞULLARI\n\nSon Güncelleme: 2024\n\n1. GENEL HÜKÜMLER\nTaşıYo Lojistik Platformu ("Platform"), yük sahiplerini ve taşıyıcıları bir araya getiren dijital bir lojistik aracılık hizmetidir. Bu Kullanım Koşulları ("Koşullar"), Platform'u kullanan tüm kullanıcılar için geçerlidir.\n\n2. TARAFLAR\nİşbu sözleşme, TaşıYo Lojistik A.Ş. ("TaşıYo") ile Platform'a kayıt olan kullanıcı ("Kullanıcı") arasında akdedilmiştir.\n\n3. KULLANIM KOŞULLARI\n3.1. Platform'u kullanmak için en az 18 yaşında olmanız veya yasal temsilcinizin onayına sahip olmanız gerekmektedir.\n3.2. Kayıt sırasında verilen bilgiler eksiksiz ve doğru olmalıdır.\n3.3. Hesap güvenliğinizden siz sorumlusunuz. Şifrenizi kimseyle paylaşmayınız.\n3.4. Platform üzerinden gerçekleştirilen işlemler Türk Ticaret Kanunu ve ilgili mevzuat hükümlerine tabidir.\n\n4. YASAKLANAN FAALİYETLER\nKullanıcılar aşağıdaki faaliyetlerde bulunamaz:\n- Sahte ilan veya teklif oluşturmak\n- Başka kullanıcıları yanıltmak\n- Platform altyapısına zarar vermek\n- İlgili mevzuata aykırı taşımacılık faaliyetinde bulunmak\n\n5. HİZMET BEDELİ VE ÖDEME\n5.1. Platform ücretsiz üyelik imkânı sunmakla birlikte belirli hizmetler için ücret talep edebilir.\n5.2. Ödemeler, Platform'un belirlediği koşullar çerçevesinde gerçekleştirilir.\n\n6. FİKRİ MÜLKİYET\nPlatform'a ait tüm içerikler, tasarım unsurları ve yazılımlar TaşıYo'nun mülkiyetindedir ve izinsiz kullanılamaz.\n\n7. SORUMLULUĞUN SINIRLANDIRILMASI\nTaşıYo, kullanıcılar arasında gerçekleşen anlaşmazlıklarda arabulucu konumunda olup kargo hasarı ve gecikmelerden doğrudan sorumlu tutulamaz.\n\n8. SÖZLEŞMENİN FESHİ\nTaşıYo, bu Koşullar'ı ihlal eden kullanıcıların hesabını bildirimde bulunmaksızın askıya alabilir veya silebilir.\n\n9. UYGULANACAK HUKUK\nBu Koşullar Türk Hukuku'na tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.\n\n10. İLETİŞİM\nSorularınız için: destek@tasiyo.com	2	2026-03-25 03:13:11.964+00
\.


--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversation_participants (id, conversation_id, user_id) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversations (id, updated_at) FROM stdin;
\.


--
-- Data for Name: loads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loads (id, title, description, origin, destination, distance, weight, load_type, vehicle_type, pricing_model, price, min_bid, max_bid, status, is_premium, posted_by_id, offers_count, pickup_date, delivery_date, origin_lat, origin_lng, dest_lat, dest_lng, created_at) FROM stdin;
1	Ankara-İstanbul Genel Yük	Ambalajlı elektronik ürünler, kırılgan değil	Ankara	İstanbul	450	12500	Genel Yük	Tır	fixed	8500	\N	\N	active	t	6	3	2026-03-25 23:08:31.021469+00	2026-03-26 23:08:31.021469+00	39.9334	32.8597	41.0082	28.9784	2026-03-23 23:08:31.021469+00
2	İzmir-Ankara Parsiyel Taşıma	Tekstil ürünleri, 5 palet	İzmir	Ankara	580	3200	Parsiyel	Kamyon	bidding	\N	3500	\N	active	f	7	5	2026-03-24 23:08:31.021469+00	2026-03-25 23:08:31.021469+00	38.4189	27.1287	39.9334	32.8597	2026-03-23 23:08:31.021469+00
3	İstanbul-Bursa Soğuk Zincir	Gıda ürünleri, +4°C soğuk zincir gerektirir	İstanbul	Bursa	150	8000	Soğuk Zincir	Frigorifik	fixed	4200	\N	\N	active	t	6	1	2026-03-26 23:08:31.021469+00	2026-03-27 23:08:31.021469+00	41.0082	28.9784	40.1885	29.061	2026-03-23 23:08:31.021469+00
4	Konya-Mersin Konteyner	40 ayak konteyner, kimyasal dışı	Konya	Mersin	320	22000	Konteyner	Tır	bidding	\N	6000	\N	active	f	7	2	2026-03-27 23:08:31.021469+00	2026-03-28 23:08:31.021469+00	37.8714	32.4847	36.8121	34.6415	2026-03-23 23:08:31.021469+00
5	Gaziantep-Ankara İnşaat Malzemeleri	Demir profiller ve çimento	Gaziantep	Ankara	680	18000	İnşaat Malzemesi	Açık Kasa	fixed	7800	\N	\N	active	f	6	0	2026-03-24 23:08:31.021469+00	2026-03-25 23:08:31.021469+00	37.0662	37.3833	39.9334	32.8597	2026-03-23 23:08:31.021469+00
6	Trabzon-İstanbul Kuru Yük	Fındık ürünleri	Trabzon	İstanbul	1100	15000	Kuru Yük	Tenteli TIR	fixed	12000	\N	\N	assigned	t	6	4	2026-03-22 23:08:31.021469+00	2026-03-24 23:08:31.021469+00	41.0027	39.7168	41.0082	28.9784	2026-03-23 23:08:31.021469+00
7	Samsun-Ankara Tarım Ürünleri	Taze sebze ve meyve	Samsun	Ankara	420	9500	Gıda	Frigorifik	bidding	\N	4500	\N	active	f	7	3	2026-03-25 23:08:31.021469+00	2026-03-26 23:08:31.021469+00	41.2867	36.33	39.9334	32.8597	2026-03-23 23:08:31.021469+00
8	Kayseri-İzmir Mobilya	Hazır mobilya paketleri, 200 kutu	Kayseri	İzmir	780	11000	Mobilya	Perde Kasalı	fixed	9200	\N	\N	completed	f	6	2	2026-03-18 23:08:31.021469+00	2026-03-20 23:08:31.021469+00	38.7312	35.4787	38.4189	27.1287	2026-03-23 23:08:31.021469+00
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, conversation_id, sender_id, body, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, body, is_read, related_id, created_at) FROM stdin;
1	2	new_load	Yeni Yük İlanı	Ankara-İstanbul güzergahında 12.5 ton yük ilanı oluşturuldu. Fiyat: 8.500₺	f	1	2026-03-23 23:09:31.97528+00
2	2	offer_accepted	Teklifiniz Kabul Edildi	İstanbul-Bursa güzergahı için verdiğiniz teklif kabul edildi!	f	6	2026-03-23 23:09:31.97528+00
3	3	new_load	Yakın Yük Bulundu	İzmir civarında 3.200 kg yük ilanı var. Teklif verin!	t	2	2026-03-23 23:09:31.97528+00
4	4	offer_received	Yeni Teklif Alındı	Ankara-İstanbul ilanınız için 3 yeni teklif var	f	1	2026-03-23 23:09:31.97528+00
5	2	shipment_update	Sevkiyat Güncellendi	Trabzon-İstanbul sevkiyatı Samsun kontrolünden geçti	t	1	2026-03-23 23:09:31.97528+00
6	1	system	Sistem Bakımı	Pazar günü saat 03:00-05:00 arası planlı bakım yapılacaktır	f	\N	2026-03-23 23:09:31.97528+00
\.


--
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.offers (id, load_id, driver_id, amount, note, status, created_at) FROM stdin;
1	1	2	8200	Zamanında teslim garantisi veriyorum, 10 yıllık deneyim	pending	2026-03-23 23:09:07.274145+00
2	1	3	8100	Sigortam var, GPS takip sistemi mevcut	pending	2026-03-23 23:09:07.274145+00
3	1	4	8400	İstanbul'a sık gidiyorum, güvenilir teslimat	pending	2026-03-23 23:09:07.274145+00
4	2	2	3800	Parsiyel yük konusunda uzmanım	pending	2026-03-23 23:09:07.274145+00
5	2	5	3600	Frigorifik araç var, tekstil için ideal	pending	2026-03-23 23:09:07.274145+00
6	3	5	4200	Soğuk zincir sertifikam var	accepted	2026-03-23 23:09:07.274145+00
7	4	2	6200	Konteyner taşıma deneyimim fazla	pending	2026-03-23 23:09:07.274145+00
8	4	3	6500	\N	pending	2026-03-23 23:09:07.274145+00
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otp_codes (id, identifier, identifier_type, code, is_used, expires_at, created_at) FROM stdin;
1	ahmet@logistikco.com	email	398670	t	2026-03-23 23:44:41.242+00	2026-03-23 23:34:41.246001+00
2	ahmet@logistikco.com	email	385925	t	2026-03-24 01:13:58.634+00	2026-03-24 01:03:58.649477+00
3	ahmet@logistikco.com	email	340137	t	2026-03-24 01:14:07.591+00	2026-03-24 01:04:07.597757+00
4	ahmet@logistikco.com	email	212801	t	2026-03-25 01:21:26.118+00	2026-03-25 01:11:26.151587+00
5	ahmet@logistikco.com	email	802857	f	2026-03-25 01:25:40.306+00	2026-03-25 01:15:40.337817+00
6	kvkk_test@example.com	email	209635	f	2026-03-25 02:40:46.703+00	2026-03-25 02:30:46.703883+00
7	navigoaractakip@gmail.com	email	972083	t	2026-03-25 02:58:17.117+00	2026-03-25 02:48:17.119885+00
8	navigoaractakip@gmail.com	email	839273	t	2026-03-25 03:03:01.763+00	2026-03-25 02:53:01.765718+00
9	navigoaractakip@gmail.com	email	568810	t	2026-03-25 03:04:04.544+00	2026-03-25 02:54:04.54693+00
10	navigoaractakip@gmail.com	email	780334	t	2026-03-25 03:04:13.69+00	2026-03-25 02:54:13.695711+00
11	navigoaractakip@gmail.com	email	263960	t	2026-03-25 03:20:57.847+00	2026-03-25 03:10:57.850299+00
12	navigoaractakip@gmail.com	email	358189	t	2026-03-25 03:22:12.656+00	2026-03-25 03:12:12.658202+00
13	navigoaractakip@gmail.com	email	673260	t	2026-03-25 03:23:11.676+00	2026-03-25 03:13:11.679124+00
14	navigoaractakip@gmail.com	email	623969	t	2026-03-25 03:24:16.754+00	2026-03-25 03:14:16.756996+00
15	navigoaractakip@gmail.com	email	721559	t	2026-03-25 03:24:25.154+00	2026-03-25 03:14:25.158671+00
16	navigoaractakip@gmail.com	email	537825	t	2026-03-25 03:29:29.025+00	2026-03-25 03:19:29.028099+00
17	navigoaractakip@gmail.com	email	724452	t	2026-03-25 03:29:43.359+00	2026-03-25 03:19:43.362939+00
18	navigoaractakip@gmail.com	email	646738	t	2026-03-25 03:31:06.924+00	2026-03-25 03:21:06.926546+00
19	navigoaractakip@gmail.com	email	435003	t	2026-03-25 03:31:20.146+00	2026-03-25 03:21:20.15141+00
20	navigoaractakip@gmail.com	email	238933	t	2026-03-25 03:55:13.45+00	2026-03-25 03:45:13.452789+00
21	navigoaractakip@gmail.com	email	117044	t	2026-03-25 03:55:29.562+00	2026-03-25 03:45:29.566693+00
22	navigoaractakip@gmail.com	email	464988	t	2026-03-25 04:00:12.479+00	2026-03-25 03:50:12.481078+00
23	navigoaractakip@gmail.com	email	132084	t	2026-03-25 04:00:23.079+00	2026-03-25 03:50:23.084239+00
24	navigoaractakip@gmail.com	email	565203	t	2026-03-25 04:15:17.264+00	2026-03-25 04:05:17.267169+00
25	navigoaractakip@gmail.com	email	782124	f	2026-03-25 04:15:40.39+00	2026-03-25 04:05:40.394589+00
\.


--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.platform_settings (id, key, value, label, description, "group", is_secret, updated_at) FROM stdin;
1	twilio_account_sid	\N	Twilio Account SID	Twilio hesabınızın Account SID değeri	sms	t	2026-03-23 23:35:07.258652+00
2	twilio_auth_token	\N	Twilio Auth Token	Twilio API Auth Token	sms	t	2026-03-23 23:35:07.261664+00
3	twilio_phone_number	\N	Twilio Telefon No	Mesaj gönderilecek Twilio numarası (örn: +19876543210)	sms	f	2026-03-23 23:35:07.263751+00
4	smtp_host	\N	SMTP Sunucu	Örn: smtp.gmail.com	email	f	2026-03-23 23:35:07.266356+00
5	smtp_port	\N	SMTP Port	Örn: 587 (TLS) veya 465 (SSL)	email	f	2026-03-23 23:35:07.270062+00
6	smtp_user	\N	SMTP Kullanıcı	E-posta adresi	email	f	2026-03-23 23:35:07.272502+00
7	smtp_pass	\N	SMTP Şifre	E-posta veya uygulama şifresi	email	t	2026-03-23 23:35:07.274539+00
8	smtp_from	\N	Gönderen Adres	Örn: "TaşıYo <no-reply@tasiyo.com>"	email	f	2026-03-23 23:35:07.276385+00
9	platform_name	\N	Platform Adı	Platformun görünen adı	platform	f	2026-03-23 23:35:07.279173+00
10	platform_support_email	\N	Destek E-posta	Kullanıcıların ulaşacağı destek adresi	platform	f	2026-03-23 23:35:07.28105+00
11	otp_expiry_minutes	\N	OTP Süresi (dk)	Doğrulama kodunun geçerlilik süresi	platform	f	2026-03-23 23:35:07.28297+00
12	max_otp_attempts	\N	Maks. OTP Deneme	Başarısız giriş denemesi limiti	platform	f	2026-03-23 23:35:07.284897+00
13	platform_logo	\N	Platform Logosu	Sol üst köşede görünen platform logosu (base64 resim)	platform	f	2026-03-25 00:17:55.667399+00
\.


--
-- Data for Name: shipment_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shipment_events (id, shipment_id, event, description, lat, lng, "timestamp") FROM stdin;
1	1	Yükleme Başladı	Trabzon Liman bölgesinde yükleme yapıldı	41.0027	39.7168	2026-03-23 11:09:27.116966+00
2	1	Yola Çıkıldı	Sürücü rota üzerinde	40.92	38.3	2026-03-23 13:09:27.116966+00
3	1	Kontrol Noktası	Samsun çevresinden geçildi	41.2867	36.33	2026-03-23 17:09:27.116966+00
4	1	Yolda	Ankara yönüne doğru devam ediliyor	40.689	31.149	2026-03-23 21:09:27.116966+00
\.


--
-- Data for Name: shipments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shipments (id, load_id, driver_id, status, current_lat, current_lng, estimated_arrival, created_at) FROM stdin;
1	6	2	in_transit	40.689	31.149	2026-03-24 07:08:51.213177+00	2026-03-23 23:08:51.213177+00
2	8	3	delivered	38.4189	27.1287	2026-03-22 23:08:51.213177+00	2026-03-23 23:08:51.213177+00
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.support_tickets (id, user_id, subject, category, priority, message, status, admin_id, admin_reply, replied_at, created_at, updated_at) FROM stdin;
1	1	Test Destek Talebi	technical	high	Platform üzerinde teknik bir sorun yaşıyorum, yardım ihtiyacım var.	resolved	1	Sorununuz incelendi. Teknik ekibimiz en kısa sürede size dönecektir.	2026-03-25 03:51:55.246+00	2026-03-25 03:51:06.279287+00	2026-03-25 03:51:55.246+00
\.


--
-- Data for Name: user_consents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_consents (id, user_id, terms_accepted, privacy_accepted, distance_sales_accepted, marketing_consent, location_consent, ip_address, consent_timestamp, terms_version, privacy_version, distance_sales_version) FROM stdin;
1	11	t	t	f	f	f	::1	2026-03-25 02:30:46.698+00	1	1	1
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_sessions (id, user_id, token, expires_at, created_at) FROM stdin;
1	1	1dfa5ea13daf438bcf64d7786f0bd532cb4f10d84a6d1fac49172fe9b81ffa28	2026-04-22 23:34:59.79+00	2026-03-23 23:34:59.790799+00
2	1	fba7b41f3e1060d0b95101c58fb1d70e14c32e1c559f065453185c6cac87b9ff	2026-04-24 02:48:25.023+00	2026-03-25 02:48:25.024018+00
3	1	10f7ce63b720812434eb2f0efd505b14829b80eb7ceac3c0e85181ee7c18ce35	2026-04-24 02:53:01.951+00	2026-03-25 02:53:01.951597+00
4	1	80ccf8f7503ef98200f1449e3ce5603bf601b5efaa7c1b3867d4b8a81efa079c	2026-04-24 02:54:31.203+00	2026-03-25 02:54:31.203984+00
5	1	831d487f28c78901bc6f7a5f605c1abc1f8d5cf3c553a044da1a33e26b730fc4	2026-04-24 03:10:57.982+00	2026-03-25 03:10:57.982786+00
6	1	d7aaab325aaebe41c5dec6592b9976aebf66d88b011eb212562a5eb7b9a20971	2026-04-24 03:12:12.778+00	2026-03-25 03:12:12.779042+00
7	1	f3a28363d7a81eb4b46f0b01abd0f7e8f45f4ea5f3e0aa4e0ec09b6f3c17a7f8	2026-04-24 03:13:11.794+00	2026-03-25 03:13:11.795365+00
8	1	f2257fba5ac272bb74d743504092f605010064b54b161eb605ebd4f9845f97a8	2026-04-24 03:14:45.582+00	2026-03-25 03:14:45.58247+00
9	1	38647d2c6a4265d07b8713bd07956e07a74e8cb501944ba6b0c3e38a2b233fdf	2026-04-24 03:19:53.437+00	2026-03-25 03:19:53.438085+00
10	1	fc76a9512a9fcb688a792d49bb5c7c178205fc4315ca9f4c91a6d703d071fad3	2026-04-24 03:21:34.751+00	2026-03-25 03:21:34.751587+00
11	1	1c150a6a530dd55b35c057b672366f2415bc05a92e81d48035f14498d53f3006	2026-04-24 03:45:35.871+00	2026-03-25 03:45:35.871765+00
12	1	d75a7d318e5897870b307881be38e35fb1518fcc84ed8082e8ba5fd852d4a465	2026-04-24 03:50:44.65+00	2026-03-25 03:50:44.650868+00
13	6	zhIWPB8rNCFCNK7urTzlR1ERIECjrY8M	2026-04-24 04:08:22.676+00	2026-03-25 04:08:22.677432+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, phone, role, status, company, avatar_url, rating, total_shipments, created_at, website, address, tax_number, vehicle_types, notification_settings) FROM stdin;
2	Mehmet Yılmaz	mehmet@driver.com	+90 533 222 3344	driver	active	\N	\N	4.8	127	2026-03-23 23:08:05.467965+00	\N	\N	\N	\N	\N
3	Ali Kaya	ali@driver.com	+90 534 333 4455	driver	active	\N	\N	4.5	89	2026-03-23 23:08:05.467965+00	\N	\N	\N	\N	\N
4	Hasan Demir	hasan@driver.com	+90 535 444 5566	driver	active	\N	\N	4.2	56	2026-03-23 23:08:05.467965+00	\N	\N	\N	\N	\N
5	Fatma Şahin	fatma@driver.com	+90 536 555 6677	driver	active	\N	\N	4.9	214	2026-03-23 23:08:05.467965+00	\N	\N	\N	\N	\N
6	Elif Holding A.Ş.	info@elif-holding.com	+90 212 345 6789	corporate	active	Elif Holding A.Ş.	\N	4.7	342	2026-03-23 23:08:05.467965+00	\N	\N	\N	\N	\N
7	Marmara Lojistik Ltd.	ops@marmara-lojistik.com	+90 216 456 7890	corporate	active	Marmara Lojistik Ltd.	\N	4.6	218	2026-03-23 23:08:05.467965+00	\N	\N	\N	\N	\N
8	Orhan Tekstil A.Ş.	lojistik@orhantekstil.com	+90 212 567 8901	corporate	pending	Orhan Tekstil A.Ş.	\N	4.3	98	2026-03-23 23:08:05.467965+00	\N	\N	\N	\N	\N
9	Yusuf Taşıma	yusuf@tasima.com	+90 537 666 7788	individual	active	\N	\N	4.1	34	2026-03-23 23:08:05.467965+00	\N	\N	\N	\N	\N
10	Zeynep Kargo	zeynep@kargo.com	+90 538 777 8899	individual	pending	\N	\N	0	0	2026-03-23 23:08:05.467965+00	\N	\N	\N	\N	\N
11	Test Kullanici	kvkk_test@example.com	\N	driver	active	\N	\N	5	0	2026-03-25 02:30:46.66298+00	\N	\N	\N	\N	\N
1	Ahmet Çelik	navigoaractakip@gmail.com	+90 532 111 2233	admin	active	TaşıYo A.Ş.	\N	5	0	2026-03-23 23:08:05.467965+00	www.tasiyo.com	Istanbul Kadikoy	1234567890	["Tir","Kamyon"]	{"newOffer":true}
\.


--
-- Name: contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contracts_id_seq', 5, true);


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.conversation_participants_id_seq', 1, false);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.conversations_id_seq', 1, false);


--
-- Name: loads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.loads_id_seq', 8, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 6, true);


--
-- Name: offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.offers_id_seq', 8, true);


--
-- Name: otp_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.otp_codes_id_seq', 25, true);


--
-- Name: platform_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.platform_settings_id_seq', 13, true);


--
-- Name: shipment_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shipment_events_id_seq', 4, true);


--
-- Name: shipments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shipments_id_seq', 2, true);


--
-- Name: support_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.support_tickets_id_seq', 1, true);


--
-- Name: user_consents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_consents_id_seq', 1, true);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 13, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- Name: contracts contracts_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_key_unique UNIQUE (key);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: loads loads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loads
    ADD CONSTRAINT loads_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_key_unique UNIQUE (key);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: shipment_events shipment_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_events
    ADD CONSTRAINT shipment_events_pkey PRIMARY KEY (id);


--
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: user_consents user_consents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_token_unique UNIQUE (token);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: user_consents user_consents_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consents
    ADD CONSTRAINT user_consents_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict ptDGAfKcg0BFdV6qgWfIbmuv3A5zEoFCUo33YnQ3WZdCXkbMc0aA5zYuvbWtfue

