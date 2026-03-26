import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

const STORAGE_KEY = "tasiyo_disclaimer_accepted";

export default function DisclaimerModal() {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
            aria-labelledby="disclaimer-title"
          >
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <h2 id="disclaimer-title" className="text-base font-bold text-amber-900 leading-tight">
                  Önemli Bilgilendirme
                </h2>
              </div>

              {/* Body */}
              <div className="px-6 py-5 overflow-y-auto text-sm text-slate-700 space-y-4 flex-1">
                <p className="leading-relaxed">
                  Bu platform, nakliye hizmeti verenler ile hizmet talep eden kullanıcıları bir araya getiren bir ilan ve aracılık platformudur.
                </p>

                <div>
                  <p className="font-semibold text-slate-800 mb-2">Platform üzerinden gerçekleştirilen taşıma işlemlerinde:</p>
                  <ul className="space-y-2">
                    {[
                      "Hizmetin ifası, kalitesi ve güvenliği tamamen tarafların sorumluluğundadır.",
                      "Platform, taşıma sürecine taraf değildir ve taşıyıcı sıfatı bulunmamaktadır.",
                      "Taraflar arasında doğabilecek zarar, kayıp, gecikme ve benzeri uyuşmazlıklardan platform sorumlu tutulamaz.",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-slate-800 mb-2">Lütfen işlem yapmadan önce:</p>
                  <ul className="space-y-2">
                    {[
                      "Taşıyıcı bilgilerini doğrulayınız",
                      "Sözleşme ve sigorta durumunu kontrol ediniz",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                  Devam ederek,{" "}
                  <span className="font-medium text-slate-700">Kullanım Şartları</span> ve{" "}
                  <span className="font-medium text-slate-700">Gizlilik Politikası</span>'nı
                  okuduğunuzu ve kabul ettiğinizi beyan edersiniz.
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-3">
                {/* Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setChecked(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setChecked(v => !v)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                        checked
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white border-slate-300 group-hover:border-blue-400"
                      }`}
                    >
                      {checked && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-slate-700 leading-snug select-none">
                    Okudum, anladım ve kabul ediyorum
                  </span>
                </label>

                {/* Button */}
                <button
                  onClick={handleAccept}
                  disabled={!checked}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    checked
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 active:scale-[0.98]"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Devam Et
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
