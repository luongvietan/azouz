# Best practices cho shop Azouz: nghiên cứu và đối chiếu, 13/10/2026

Phạm vi: shop D2C (collection, sản phẩm, giỏ hàng, checkout) và các trang B2B để thu lead (mẫu thử, báo giá, private label) của Azouz. Thị trường Jordan, tiền tệ JOD, có 3 sản phẩm với tuỳ chọn Weight/Grind.

**Mức độ tin cậy của nguồn.** Số liệu UX chung lấy từ benchmark của Baymard, tin cậy cao. Số liệu thanh toán CliQ lấy từ JoPACC qua báo chí Jordan, tin cậy cao. Còn lại phần lớn (tỷ lệ COD, WhatsApp, subscription, mẫu thử B2B) đến từ blog của vendor hoặc agency. Chúng chỉ nên coi là định hướng, chưa có A/B test cho ngành cà phê. Những chỗ nguồn mâu thuẫn hoặc chưa xác minh đều được ghi rõ.

Cột "Ở đâu" cho biết việc nằm ở **Theme** (sửa code repo này), **Admin** (cấu hình Shopify) hay **App** (cần cài app bên thứ ba).

## Trạng thái triển khai (13/10/2026)

Đã làm trong theme: P0-2, P0-3, P1-4, P1-5, P1-7, P1-9. Chi tiết và cách bật trong admin: [client-setup-guide.md, mục 6d](client-setup-guide.md). Test: `tests/buying-confidence.test.js` và `tests/snippet-variant-picker.test.js`.

- **P0-2:** setting "Delivery note" (Theme settings > Shop), hiển thị dưới nút mua, trong trang giỏ và drawer.
- **P0-3:** link Refund policy dưới nút mua, chỉ hiện khi đã viết policy.
- **P1-4:** biến thể chọn bằng nút (fieldset + radio, vẫn có fallback `<noscript>`). Hiện mọi bag chỉ có một biến thể, nên trang sản phẩm hiển thị tĩnh Weight và Grind.
- **P1-5:** giá theo 100g trên trang sản phẩm và thẻ sản phẩm, cập nhật khi đổi biến thể. Cần bật "Show unit price" cho từng variant trong admin.
- **P1-7:** dòng "Best for …" trên thẻ sản phẩm, lấy từ `brew_methods`, tối đa 2 phương pháp.
- **P1-9:** link WhatsApp (wa.me, có tin nhắn soạn sẵn) ở trang sản phẩm và trên form enquiry, chỉ hiện khi có số WhatsApp.

Chưa làm: P0-1 (cấu hình thanh toán trong admin), P1-6, P1-8, P2, P3.

## Tóm tắt ưu tiên

| # | Việc | Ở đâu | Hiện trạng |
| --- | --- | --- | --- |
| P0-1 | Bật thanh toán: COD, CliQ và cổng thẻ nội địa | Admin / App | Checkout báo không nhận thanh toán (QA 13/10) |
| P0-2 | Hiện phí ship và tổng chi phí trước khi thêm vào giỏ | Theme | Phí ship chỉ hiện khi đã vào checkout |
| P0-3 | Link chính sách đổi trả ngay trên trang sản phẩm | Theme | Chỉ có ở footer |
| P1-4 | Chọn Weight/Grind bằng nút thay cho dropdown | Theme | Đang là `<select>` |
| P1-5 | Giá theo đơn vị (JOD/100g) | Admin + Theme | Theme chưa đọc `unit_price` |
| P1-6 | Ghi chú độ tươi và lịch rang | Admin + Theme | Chưa có metafield |
| P1-7 | Nhãn "hợp với espresso / filter / cezve" trên thẻ sản phẩm | Theme | Có `brew_methods`, chỉ hiện trong trang sản phẩm |
| P1-8 | Bản tiếng Ả Rập | Admin + Theme | CSS đã sẵn RTL, chưa có `locales/ar.json` |
| P1-9 | Đặt WhatsApp làm kênh liên hệ ở trang sản phẩm và form | Theme | WhatsApp mới chỉ có ở footer |
| P2-10 | Bổ sung trường cho form B2B và FAQ cho Private Label | Theme | Form có loại hình kinh doanh, loại cà phê, sản lượng |
| P2-11 | Shopify B2B (giá sỉ, tài khoản công ty) cho khách sỉ đặt lại | Admin | Chưa dùng |
| P3-12 | Đánh giá sản phẩm | App + Theme | Chưa có |
| P3-13 | Subscription | App + Theme | Theme chưa hỗ trợ selling plan |

## P0: chặn doanh thu

### 1. Thanh toán phù hợp thị trường Jordan

- Theo Shopify Community, Shopify Payments chưa hoạt động ở Jordan. Thông tin này không có ngày đăng, cần kiểm tra lại danh sách quốc gia hiện tại của Shopify.
- COD vẫn là cách trả phổ biến nhất, nhưng ước tính tỷ trọng mâu thuẫn nhau: một guide nói khoảng 60%, một overview khác nói thẻ 35%, COD 30%. Cả hai đều là nguồn thương mại.
- CliQ (chuyển khoản ngân hàng tức thì) tăng nhanh theo số liệu chính thức của JoPACC. Từ tháng 1 đến tháng 9/2025 đạt 14,5 tỷ JD, tăng 73,2% so với cùng kỳ. Tháng 7/2026, giao dịch mua hàng chiếm 20,5% số giao dịch CliQ.
- COD có sẵn trong Shopify dưới dạng "manual payment method". Tuy nhiên bản gốc không có xác minh số điện thoại, không thu được phí COD và không đặt cọc được. Các app COD bổ sung OTP hoặc xác nhận qua WhatsApp. Nguồn vendor cũng cảnh báo tỷ lệ hoàn hàng cao nếu không xác minh đơn.

**Đề xuất:**
1. Bật ngay COD (manual) với hướng dẫn rõ ràng, ví dụ "Chuẩn bị đúng số tiền".
2. Thêm CliQ làm một manual payment method thứ hai, ghi alias ngân hàng và hướng dẫn gửi xác nhận chuyển khoản.
3. Xin báo giá cổng thẻ nội địa có plugin Shopify và hỗ trợ JOD. Các tên được nhắc tới gồm MyFatoorah, PayTabs, Areeba; Stripe có thể nhận JOD. Tất cả là nguồn vendor, cần xác minh trực tiếp với nhà cung cấp.
4. Nếu đơn COD giả nhiều, cài app xác minh OTP/WhatsApp.

Theme không cần sửa gì cho phần này.

### 2. Minh bạch tổng chi phí trước khi vào giỏ

- Baymard: 67% trang không hiển thị tổng chi phí ước tính (gồm phí ship) gần nút mua.
- "Chi phí phát sinh quá cao" là lý do bỏ giỏ hàng số 1, khoảng 39% theo dữ liệu Baymard 2025 do bên thứ ba trích dẫn (đã loại nhóm chỉ đang xem). Các bản cũ ghi 47–48%; nên đối chiếu trên baymard.com trước khi trích dẫn.
- Azouz hiện có hai mức ship, Amman 3 JD và ngoài Amman 5 JD, nhưng khách chỉ thấy ở checkout. Với sản phẩm 2,8 JD, phí ship có thể lớn hơn giá hàng.

**Đề xuất (Theme):** thêm một dòng dưới giá trên trang sản phẩm và trong giỏ/drawer, ví dụ "Giao hàng: Amman 3 JD, ngoài Amman 5 JD". Nội dung lấy từ setting của theme để merchant tự sửa. Nếu có ngưỡng miễn phí ship, hiện thêm số tiền còn thiếu trong giỏ.

### 3. Chính sách đổi trả ngay trên trang sản phẩm

- Baymard: 60% người dùng tìm chính sách đổi trả ở trang sản phẩm, nhưng 44% trang không có. 15% từng bỏ đơn vì chính sách không thoả đáng.

**Đề xuất (Theme):** thêm một dòng link tới `shop.refund_policy` cạnh khối mua hàng. Với cà phê (hàng tiêu dùng), nói rõ xử lý khi hàng hỏng hoặc giao sai.

## P1: trang sản phẩm và thị trường

### 4. Chọn Weight/Grind bằng nút

- Baymard: 57% trang vẫn giấu tuỳ chọn kích cỡ trong dropdown, và đây là một pitfall.
- `snippets/variant-picker.liquid` đang dùng `<select>`.

**Đề xuất (Theme):** đổi thành nhóm radio có `<fieldset>`/`<legend>`, hiển thị dạng nút. Giữ fallback `<noscript>` như hiện tại để form vẫn chạy khi tắt JavaScript. Nhãn Grind nên gắn với dụng cụ pha, ví dụ "Xay cho máy espresso" hay "Xay mịn cho cezve", vì người mua thường hỏi đúng câu đó.

### 5. Giá theo đơn vị

- Baymard: 81% trang không hiển thị giá theo đơn vị cho sản phẩm bán nhiều kích cỡ.
- Changelog Shopify (10/2025) nói unit pricing đã mở toàn cầu, trong khi một trang docs cũ vẫn ghi chỉ áp dụng EU/Thuỵ Sĩ. Cần kiểm tra trong admin.
- Không tìm thấy quy định bắt buộc giá theo đơn vị ở Jordan; Qatar và UAE thì có.

**Đề xuất:** nhập unit price trong admin, rồi cho `snippets/price.liquid` hiển thị `unit_price` / `unit_price_measurement`, ví dụ "1,40 JD / 100g". Ba sản phẩm đang có trọng lượng khác nhau (500g, 200g, lon), nên giá theo đơn vị giúp so sánh thật sự.

### 6. Độ tươi và lịch rang

- Các guide của agency coi ngày rang là yếu tố tạo niềm tin gần nút mua. Chưa có A/B test chứng minh.

**Đề xuất:** chỉ ghi điều Azouz cam kết được, ví dụ "Rang hằng tuần tại Jordan" hoặc "Rang theo đơn". Thêm metafield `custom.roast_note` hiển thị dưới giá. Không ghi ngày rang cụ thể nếu kho không quản lý theo lô.

### 7. Giúp khách chọn ngay từ trang collection

- Agency guide: nhiệm vụ của trang sản phẩm cà phê là xoá sự không chắc chắn (độ rang, hợp với espresso hay pour over, có xay sẵn không). Stumptown đưa nốt hương lên thẻ sản phẩm trong danh sách.
- Theme đã có `tasting_notes`, `roast_level` và roast meter trên thẻ. `brew_methods` chỉ có trong trang sản phẩm.

**Đề xuất (Theme):** thêm một dòng "Hợp với: Espresso" lên thẻ sản phẩm, lấy từ `brew_methods`. Chỉ có 3 sản phẩm nên chưa cần bộ lọc.

### 8. Tiếng Ả Rập

- Bằng chứng về sở thích ngôn ngữ của người mua Jordan chủ yếu đến từ agency, chưa có khảo sát độc lập.
- Theme đã dùng logical CSS properties và tách chuỗi ra file locale. Bao bì của Azouz đã song ngữ.

**Đề xuất:** thêm `locales/ar.json`, bật tiếng Ả Rập trong Shopify Markets, rồi kiểm tra RTL trên preview. Đây là việc lớn nhưng theme đã được thiết kế sẵn cho nó.

### 9. WhatsApp

- Vendor WhatsApp API cho rằng khoảng 8 triệu người Jordan dùng WhatsApp (chưa có nguồn gốc). Báo cáo Zbooni 2024 nói 87% người dùng muốn được người thật hỗ trợ.

**Đề xuất (Theme):** khi setting `social_whatsapp` có giá trị, hiện link "Hỏi qua WhatsApp" ở khối mua hàng và cạnh form mẫu thử/báo giá. Dùng `wa.me` với tin nhắn soạn sẵn có tên sản phẩm. Không dùng widget chat nổi.

## P2: B2B

### 10. Form mẫu thử, báo giá và FAQ Private Label

- Các nguồn đề xuất form 6–10 trường để lọc lead: loại hình kinh doanh, định dạng (hạt, bột, espresso blend, private label), mức sản lượng, thời điểm. Ví dụ là form của 76 Roasters. Phản hồi lead nhanh rút ngắn thời gian chốt.
- FAQ của Metropolis Coffee trả lời trước các câu private label hay bị hỏi: số lượng tối thiểu, bao bì tuỳ chỉnh, có được dùng túi riêng không, thời gian sản xuất, có thử mẫu rang riêng không.
- Form của Azouz đã có tên, công ty, email, điện thoại, loại hình kinh doanh, loại cà phê, sản lượng và lời nhắn. Báo cáo QA 13/10 cũng đề xuất thêm trường loại yêu cầu.

**Đề xuất (Theme):**
1. Thêm trường ẩn "Request type" (Sample/Quote) để email phân biệt được hai loại yêu cầu.
2. Thêm trường tuỳ chọn "Thời điểm cần" và "Thành phố".
3. Thêm khối FAQ dạng accordion `<details>` vào trang Private Label, dùng nội dung thật do Azouz cung cấp (số lượng tối thiểu, thời gian sản xuất, bao bì). Không tự viết các con số này.

**Lưu ý:** đổi tên trường form ảnh hưởng tới email và analytics (DESIGN/redesign protocol). Chỉ thêm trường mới, không đổi tên trường cũ.

### 11. Shopify B2B cho khách sỉ đặt lại

- Theo nhiều nguồn thứ cấp, từ 02/04/2026 Shopify mở các tính năng B2B lõi cho cả gói Basic: tài khoản công ty, price list (tối đa 3 trên Basic), điều khoản thanh toán Net 7–90 và số PO. Chưa đọc được changelog chính thức; cần xác minh.

**Đề xuất (Admin):** khi đã có khách sỉ đặt hàng định kỳ, tạo công ty và price list cho họ để họ đặt lại trực tuyến. Lead mới vẫn đi qua form như hiện tại.

## P3: khi đã có lượng đơn

### 12. Đánh giá sản phẩm
Baymard: 89% trang không phản hồi đánh giá tiêu cực, và 63% không cho xem ảnh của người đánh giá. Với 3 sản phẩm và cửa hàng mới, nên bắt đầu thu đánh giá sau giao hàng (qua app), chỉ hiện khi đã có vài đánh giá thật, và trả lời mọi đánh giá xấu.

### 13. Subscription
Theo vendor, khách subscription cà phê không nhận đơn thứ hai trong khoảng 35 ngày rời bỏ nhiều gần gấp 3 lần. Các nguồn khuyên chỉ đưa ít tần suất, cho phép bỏ qua hoặc tạm dừng dễ dàng, và theo dõi churn theo cohort. Theme chưa hỗ trợ `selling_plan`. Nên làm sau khi có dữ liệu mua lại, không phải bây giờ.

## Chưa xác minh được

- Tỷ trọng thanh toán online thực tế ở Jordan: không có khảo sát độc lập.
- Danh sách cổng thanh toán hỗ trợ JOD trên Shopify: không có tài liệu chính thức của Shopify.
- Quy định giá theo đơn vị ở Jordan: chưa tìm thấy. Nên tra Bộ Công Thương hoặc JSMO bằng tiếng Ả Rập.
- Core Web Vitals của shop: vẫn chưa đo, PageSpeed API hết quota trong lượt QA trước.

## Nguồn

- [Baymard: Product Page UX best practices](https://baymard.com/blog/current-state-ecommerce-product-page-ux)
- [Ringly: cart abandonment statistics 2026 (trích dẫn Baymard)](https://www.ringly.io/blog/ecommerce-cart-abandonment-statistics-2026) · [Contentsquare](https://contentsquare.com/en/guides/cart-abandonment/stats/) · [OptinMonster](https://optinmonster.com/cart-abandonment-statistics/)
- [Jordan News: CliQ nửa đầu 2025](https://www.jordannews.jo/Section-112/Economy/8-8-Billion-Dinars-in-Transactions-via-CliQ-in-First-Half-of-2025-43204) · [Jordan News: CliQ tháng 7](https://www.jordannews.jo/Section-112/Economy/JOD-2-34-Billion-in-CliQ-Transfer-Values-in-Jordan-During-Last-July-54190) · [MEA Tech Watch: eFAWATEERcom](https://meatechwatch.com/2025/10/15/jordan-efawateercom-payment-transactions-reach-16-3-billion-in-2025/)
- [eGrow: COD ở Jordan](https://www.egrow.com/en/blog/cod-jordan-ecommerce-2026) · [EasyApps: selling on Shopify Jordan](https://easyappsecom.com/guides/selling-on-shopify-jordan)
- [Shopify Community: Shopify Payments ở Jordan](https://community.shopify.com/t/will-shopify-payment-be-available-in-jordan-soon/114582/2) · [Shopify Community: Dinar jordanien](https://community.shopify.com/t/dinar-jordanien/138712/1) · [CartDNA: JOD](https://cartdna.com/en-gb/payment-currencies/jod) · [PayTabs](https://paytabs.com/?p=39655)
- [Releasit: bật COD trên Shopify](https://www.releas.it/blogs/news/how-to-enable-cod-shopify) · [Secure COD app](https://apps.shopify.com/secure-cod-1?locale=fi) · [ECOSIRE COD verification](https://ecosire.com/apps/shopify/shopify-cod-verification)
- [Shopify dev: Unit pricing](https://shopify.dev/docs/storefronts/themes/pricing-payments/unit-pricing) · [Shopify changelog: unit pricing toàn cầu](https://changelog.shopify.com/posts/unit-pricing-is-now-available-globally) · [Qatar MOCI: unit prices](https://www.moci.gov.qa/en/mec_news/ministry-of-economy-and-commerce-obliges-major-retail-outlets-to-adopt-unit-prices/)
- [Wapiti: UX patterns cho roaster](https://wapiti.digital/best-ecommerce-themes-and-ux-patterns-for-coffee-roasters/) · [Wapiti: SEO cho roaster](https://wapiti.digital/seo-for-coffee-roasters-product-pages-subscriptions-and-local-discovery/) · [ecomm.design: Stumptown](https://ecomm.design/site/stumptown-coffee-roasters/) · [Barrel: Onyx Coffee Lab](https://www.barrelny.com/dtc-patterns-articles/transparency-at-every-step-discover-onyx-coffee-labs-find-my-roast-feature) · [Launchtip](https://www.launchtip.com/blog/8-best-shopify-themes-for-specialty-coffee-roasters)
- [Shopcircle: form mẫu thử B2B](https://shopcircle.co/blogs/news/create-shopify-form-requesting-product-samples-business-use) · [76 Roasters wholesale form](https://tally.so/r/vGGKEl) · [Metropolis Coffee FAQ](https://metropoliscoffee.com/faq/) · [Vending Times](https://www.vendingtimes.com/news/make-your-website-a-lead-generator-not-a-coffee-service-catalog/) · [Danish Lead Co](https://danishleadco.io/blog/why-sample-requests-should-be-your-first-conversion-goal) · [Contra: sample request UX spec](https://contra.com/p/RBXBeeeM-spec-wholesale-coffee-sample-request-ux)
- [Ringly: Shopify B2B 2026](https://www.ringly.io/blog/shopify-b2b-ecommerce) · [Wholesale Helper](https://wholesalehelper.io/blog/shopify-b2b-on-all-plans/?amp=1) · [eFoli: B2B theo gói](https://efoli.com/blog/shopify-b2b-by-plan)
- [Go4WhatsUp: Jordan](https://go4whatsup.com/jordan/) · [Entrepreneur ME: Zbooni 2024](https://mena.entrepreneur.com/growth-strategies/seven-of-the-biggest-findings-from-zboonis-2024-mena/469678) · [Campaign ME](https://campaignme.com/the-role-of-marketing-in-a-dropshipping-business/)
- [Subscribfy: retention cà phê](https://hub.subscribfy.com/docs/blog/2026-05-05-what-drives-retention-in-coffee-subscriptions-on-shopify) · [RoasterTools](https://www.roastertools.com/blog/best-practices-for-launching-maintaining-a-coffee-subscription-program) · [Tenten](https://tenten.co/shopify/d2c-coffee-tea-subscription-shopify/)
