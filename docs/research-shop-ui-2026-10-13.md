# UI phù hợp cho shop Azouz: nghiên cứu và đề xuất, 13/10/2026

Báo cáo này nối tiếp [research-shop-best-practices-2026-10-13.md](research-shop-best-practices-2026-10-13.md). Báo cáo trước đã bàn về thanh toán, phí ship, giá theo đơn vị, WhatsApp và các mục đó đã triển khai. Báo cáo này chỉ bàn về **giao diện**: bố cục, thứ tự thông tin, mobile, RTL. Mọi đề xuất giữ hệ thiết kế hiện có: một font Baloo, label bao bì, Graphite cho hành động, Sage Light làm nền, radius 4px/8px.

**Mức độ tin cậy.** Nguồn chính gồm các bài miễn phí của Baymard (tin cậy cao, nhưng phần chi tiết nằm sau paywall), tài liệu RTL của Material, Wikimedia, Mozilla và Workday (tin cậy cao), cùng A/B test của vendor (chỉ tham khảo). Số đo trên Azouz được chụp từ preview local cổng 4322 sau các thay đổi ngày 13/10, không phải storefront thật.

## Trạng thái triển khai (13/10/2026)

Đã làm UI-1 (không gồm sticky bar), UI-2, UI-3, UI-4. Đo lại bằng cùng script trên preview cổng 4322:

| Viewport | Số đo | Trước | Sau |
| --- | --- | --- | --- |
| 390×844 | Sản phẩm: Add to cart | 1081–1129 (dưới màn đầu) | **782–830 (trong màn đầu)** |
| 390×844 | Sản phẩm: tên / giá | 730 / 919 | 482 / 635 |
| 360×740 | Sản phẩm: giá / Add to cart | 903 / 1132 | **631 (trong màn đầu)** / 844 |
| 390×844 | Shop: đáy sản phẩm thứ 3 / chiều cao trang | 2687 / 3919 | **1457 / 2689** |
| 1440×900 | Shop: giá hàng đầu | ≈1000 | **891 (trong màn đầu)** |
| 1280×720 | Shop: tên hàng đầu / giá | ≈870 / ≈1030 | **662–694 (trong màn đầu)** / 859 |

Mục tiêu ban đầu cho UI-3 là giá hàng đầu nằm trong 720px. Mục tiêu này **không đạt**: ở 1280×720 tên sản phẩm đã trong màn đầu nhưng giá ở y=859. Đạt được nữa sẽ phải cắt ảnh bao bì; nội dung ảnh chiếm 7–94% chiều cao nên cắt 1:1 sẽ mất đỉnh túi espresso. Đã thử đặt ảnh trong panel vuông trắng, nhưng ảnh lon filter chụp trên nền #F9F8F6 nên lộ khung, vì vậy đã bỏ cách đó.

Thay đổi:
- **UI-1:** breadcrumb mobile thu còn "← Shop"; thumbnail thành cột dọc cạnh ảnh chính; ảnh chính tối đa 30dvh; label và khoảng cách gọn hơn.
- **UI-2:** thẻ sản phẩm dạng hàng dưới 40em; ẩn "Sort by" khi có từ 6 sản phẩm trở xuống; thêm dòng trọng lượng gói ("500g, Whole Bean") trên thẻ.
- **UI-3:** ảnh giữ tỷ lệ 4:5 gốc, cao tối đa 34dvh, căn giữa trên label; tiêu đề collection chuyển sang cỡ `--text-3xl`.
- **UI-4:** tiêu đề drawer là "Added to your cart" khi mở do vừa thêm, "Your cart" khi mở từ header. Dòng vừa thêm có vạch mực 2px và được cuộn vào tầm nhìn; tìm dòng theo line key, dự phòng bằng variant id. Thêm nút "Continue shopping".

Test: `tests/shop-ui.test.js`, cập nhật `tests/section-main-collection.test.js`. Ảnh: [mobile sản phẩm](qa-2026-10-13/shop-ui-mobile-product.jpg), [mobile shop](qa-2026-10-13/shop-ui-mobile-shop.jpg), [desktop shop](qa-2026-10-13/shop-ui-desktop-shop.jpg).

## Hiện trạng đo được (trước khi sửa)

| Viewport | Trang | Số đo |
| --- | --- | --- |
| 390×844 (iPhone) | Sản phẩm | Ảnh 228–566, tên sản phẩm từ y=730, giá 919, **Add to cart 1081–1129**: nằm dưới màn hình đầu khoảng 240px |
| 360×740 (Android nhỏ) | Sản phẩm | Add to cart 1132–1180, dưới màn hình đầu khoảng 390px |
| 390×844 | Shop | Thẻ đầu tiên bắt đầu ở y=470; **mỗi thẻ cao khoảng 707px**, 3 sản phẩm chiếm 3 màn hình |
| 1280×720 (laptop) | Shop | Thẻ cao khoảng 786px; label và giá của hàng đầu nằm khoảng y≈950, dưới màn hình đầu |
| 1440×900 | Sản phẩm | Add to cart 612–660, trong màn hình đầu. Ổn |
| 390×844 | Trang chủ | Dài 10.927px, khoảng 13 màn hình |

Desktop trang sản phẩm đã tốt. Vấn đề nằm ở mobile và ở mật độ trang shop.

## Đề xuất, xếp theo tác động

### UI-1. Trang sản phẩm mobile: đưa tên, giá và nút mua lên gần màn hình đầu

**Căn cứ.** Baymard đánh giá trang sản phẩm mobile kém hơn desktop: chỉ 38% site đạt mức "decent" trở lên. Nghiên cứu gallery của Baymard cho thấy thumbnail tốt hơn dấu chấm trên mobile, nhưng chỉ 24% site mobile dùng thumbnail. Azouz đã có thumbnail, nên phần này cần giữ.

**Đề xuất:**
1. Dưới 56em, thay breadcrumb ba cấp bằng một link "Shop" có mũi tên quay lại, tiết kiệm khoảng 40px.
2. Giảm giới hạn ảnh chính từ `40dvh` xuống khoảng `34dvh` và thu nhỏ rail thumbnail (vẫn giữ thumbnail).
3. Giảm padding của label block trên mobile, chuyển subtitle (nốt hương) lên ngay dưới tên.
4. Mục tiêu: ở 390×844, tên và giá nằm trong màn hình đầu, Add to cart chỉ cách một lần cuộn ngắn.

**Thanh mua dính (sticky buy bar), là tuỳ chọn có đo lường.** Bằng chứng lẫn lộn. Các A/B test công khai của Cleancommit cho thấy add-to-cart tăng 3,9–8,7%, nhưng có test làm giảm giá trị đơn hàng hoặc doanh thu. Nếu làm, chỉ hiện thanh này khi nút Add to cart chính đã cuộn khỏi màn hình (dùng IntersectionObserver, không dùng scroll listener). Thanh chỉ gồm tên, giá và nút, không có ưu đãi hay đếm ngược. Theo dõi tỷ lệ add-to-cart và tỷ lệ checkout trong Shopify Analytics 2–4 tuần trước khi giữ lại.

### UI-2. Trang shop mobile: dạng danh sách cho catalog 3 sản phẩm

**Căn cứ.** Baymard khuyên dùng grid cho sản phẩm thiên về hình ảnh, list cho sản phẩm cần so sánh thông số. Họ cũng chỉ ra mâu thuẫn trên mobile: người dùng cần đủ thông tin để không phải mở từng trang, nhưng màn hình nhỏ khiến danh sách khó bao quát. Theo Retail Dive, các nhà bán lẻ có sản phẩm nặng thông số thường chọn list view trên mobile. Baymard không có bài riêng về catalog nhỏ; phần áp dụng cho Azouz là suy luận.

**Đề xuất:**
1. Dưới 40em, mỗi sản phẩm là một hàng: ảnh khoảng 40% chiều ngang bên trái; bên phải là label màu (tên, nốt hương), dòng "Best for …", giá và giá/100g. Mục tiêu là cả 3 sản phẩm nằm trong khoảng 1,2 màn hình thay vì 3. Từ 40em trở lên giữ grid như hiện tại.
2. Ẩn ô "Sort by" khi collection có từ 6 sản phẩm trở xuống, vì 3 sản phẩm không cần sắp xếp. Phần đầu trang gọn lại: tiêu đề và một dòng mô tả.
3. Giữ cùng một bộ thuộc tính trên mọi thẻ để dễ so sánh (Baymard): label, phương pháp pha, giá, giá/100g, độ rang. Bổ sung **trọng lượng gói** lên thẻ (ví dụ "500g, whole bean"); hiện người mua chỉ suy ra được trọng lượng qua giá/100g.

### UI-3. Trang shop desktop: hàng đầu phải thấy được giá

Ở 1280×720, thẻ cao khoảng 786px vì ảnh tỷ lệ 4:5 rộng tới 384–437px, nên label và giá rơi xuống dưới màn hình đầu.

**Đề xuất:** dùng ảnh sản phẩm tỷ lệ 1:1 trong grid và cắt từ ảnh bao bì có khoảng trắng đều (một việc về ảnh), hoặc giới hạn chiều rộng grid của shop ở `--content-max` (1280px) thay cho `--content-ultra`. Mục tiêu: label và giá hàng đầu nằm trong 720px. Cách cắt 1:1 cần kiểm tra trên từng ảnh để không cắt mất đỉnh túi.

### UI-4. Xác nhận đã thêm vào giỏ (drawer)

**Căn cứ.** Baymard: overlay hoặc drawer xác nhận hiệu quả khi cho thấy rõ món vừa thêm và các bước tiếp theo được đặt tên rõ ràng. Overlay thiếu chi tiết làm mất niềm tin.

**Hiện trạng:** drawer đã hiện ảnh, tên, biến thể, tạm tính, ghi chú giao hàng và hai nút Check out / View cart. Tuy nhiên tiêu đề drawer là "Your cart", dù locale đã có sẵn chuỗi "Added to your cart" chưa được dùng.

**Đề xuất:** khi drawer mở do vừa thêm sản phẩm, đổi tiêu đề thành "Added to your cart" và đánh dấu dòng vừa thêm (ví dụ vạch mực 2px ở cạnh đầu, giống trạng thái active của menu). Thêm nút chữ "Continue shopping" để đóng drawer, cạnh nút X.

### UI-5. Ảnh sản phẩm: thêm ảnh có tỷ lệ thật

**Căn cứ.** Baymard: 42% người dùng đoán kích thước sản phẩm qua ảnh, và 37% site thiếu ảnh có vật đối chiếu kích thước. Hiện mỗi sản phẩm của Azouz có 1–2 ảnh packshot.

**Đề xuất (việc nội dung, không phải code):** với mỗi sản phẩm, thêm một ảnh túi trên tay hoặc cạnh cốc để thấy kích thước 200g so với 500g, và một ảnh cận hạt hoặc bột để thấy độ xay. Gallery hiện tại tự hiển thị thêm thumbnail, không cần sửa theme.

### UI-6. Niềm tin trên giao diện

- **Footer:** hiện chỉ có email. Với thị trường Jordan và khách B2B, nên bật địa chỉ xưởng rang (thành phố) và số điện thoại hoặc WhatsApp. Footer đã có setting `address` và `show_contact`, chỉ cần điền nội dung.
- **Đánh giá:** chỉ hiện sao khi đã có đánh giá thật. Không đặt khung đánh giá trống.

### UI-7. Giao diện tiếng Ả Rập (khi làm `locales/ar.json`)

**Căn cứ:** hướng dẫn RTL của Material, Wikimedia Codex, Mozilla và Workday.

Theme đã có sẵn: `dir="rtl"` theo ngôn ngữ, CSS logical properties, mũi tên `.anchor-arrow` và icon flavour-finder được lật, vị trí mũi tên của select được đảo. Font Baloo Bhaijaan 2 có sẵn chữ Ả Rập nên không cần font thứ hai.

Danh sách cần làm thêm khi bật tiếng Ả Rập:
1. **Bỏ letter-spacing và uppercase cho chữ Ả Rập.** Chữ Ả Rập nối liền nên tracking làm vỡ chữ, và chữ Ả Rập không có hoa/thường. Các eyebrow, label bao bì và nhãn spec đang dùng `0.14–0.18em` cùng `uppercase`; cần quy tắc `:lang(ar)` đặt về 0 và `none`.
2. **Tăng line-height** cho chữ Ả Rập vì chữ cao và có dấu phụ.
3. **Lật icon có hướng:** chevron của breadcrumb và phân trang, mũi tên "View all". **Không lật** giỏ hàng, kính lúp, dấu cộng/trừ, roast meter hay logo.
4. **Giữ số theo chiều trái sang phải:** giá "JOD 7.500", giá/100g, trọng lượng "500g" và số điện thoại. Cô lập bằng `unicode-bidi: isolate` để không bị đảo trong câu tiếng Ả Rập.
5. **Đảo hướng chạy của marquee** trong RTL.
6. **Tên sản phẩm song ngữ:** bao bì đã in tên tiếng Ả Rập (ví dụ "قهوة فلتر"); dùng đúng tên đó cho bản Ả Rập.
7. **Bộ chọn ngôn ngữ** trong header ghi "العربية" bằng chữ của chính ngôn ngữ đó, không dùng cờ.

### UI-8. Những thứ không nên thêm

Phần này là đánh giá của tôi dựa trên các nguồn trên và DESIGN.md, chưa có số liệu riêng cho Azouz.

- **Hero xoay vòng (carousel) hoặc video tự chạy.** Dimitri's Coffee, đối thủ ở Amman, dùng hero xoay vòng; Azouz giữ một hero tĩnh là khác biệt rõ ràng hơn.
- **Popup newsletter khi vừa vào trang.** Đã có form trong footer.
- **Bong bóng chat nổi.** WhatsApp đặt ngay chỗ khách cần (cạnh nút mua, trên form) là đủ.
- **Đếm ngược, "chỉ còn X sản phẩm" hay ưu đãi trong thanh mua dính.** Không hợp giọng thương hiệu và dễ mất niềm tin.
- **Bộ lọc** cho 3 sản phẩm.

## So sánh nhanh với Dimitri's Coffee (Amman)

Kiểm tra trang chủ dimitriscoffee.com ngày 13/10/2026:
- Không có nút chuyển Anh/Ả Rập; một số tên trộn hai thứ tiếng ngay trong dòng.
- Hero xoay vòng.
- Thẻ sản phẩm gồm ảnh, tên và giá JD.
- Có khối đánh giá ("4.8★ across Google & TripAdvisor") và danh sách 10 chi nhánh.
- Không thấy thông tin thanh toán, giao hàng hay WhatsApp trên trang chủ.

Sau đợt 13/10, Azouz đã có những thứ Dimitri's không hiển thị: giá/100g, "Best for", phí giao hàng cạnh nút mua và WhatsApp. Điểm Dimitri's làm tốt hơn là bằng chứng xã hội (đánh giá, chi nhánh thật) và độ rộng sản phẩm.

## Đề xuất thứ tự làm

1. UI-1 (mobile sản phẩm, không gồm sticky bar), UI-2 và UI-3: sửa trong theme, có thể đo lại ngay bằng cùng script.
2. UI-4: sửa nhỏ trong theme.
3. UI-5, UI-6: việc nội dung và cấu hình của Azouz.
4. Sticky buy bar: chỉ làm khi đã có số liệu add-to-cart thật để so sánh trước và sau.
5. UI-7: cùng lúc với bản dịch tiếng Ả Rập.

## Nguồn

- [Baymard: Product Page UX](https://baymard.com/blog/current-state-ecommerce-product-page-ux)
- [Baymard: luôn dùng thumbnail cho ảnh bổ sung](https://baymard.com/blog/always-use-thumbnails-additional-images) · [Baymard: thumbnail bị cắt](https://baymard.com/blog/truncating-product-gallery-thumbnails) · [Baymard guideline: thumbnail trên mobile](https://baymard.com/guidelines/2884-thumbnails-in-image-galleries-on-mobile) · [Baymard guideline: thumbnail bị ẩn](https://baymard.com/guidelines/2875-hidden-thumbnails-in-image-galleries)
- [Baymard: Product Listing Page UX](https://baymard.com/blog/product-listing-page-plp-ux) · [Baymard: mobile product list benchmark](https://baymard.com/mcommerce-usability/benchmark/mobile-page-types/product-list) · [Retail Dive: list vs grid trên mobile](https://www.retaildive.com/news/what-retailers-selling-on-mobile-can-learn-from-tinder/415003/) · [UX Planet: list view và grid view](https://uxplanet.org/mobile-ux-design-list-view-and-grid-view-8f129b56fd5b)
- [Baymard: Added to cart confirmation](https://www.baymard.com/ecommerce-design-examples/added-to-cart-confirmation) · [Cartylabs: cart page vs drawer](https://cartylabs.com/blog/shopify-cart-page-vs-cart-drawer/) · [CRO Weekly: cart drawers](https://croweekly.substack.com/p/are-cart-drawers-bad)
- [Cleancommit: sticky mobile add to cart](https://cleancommit.io/ab-tests/sticky-mobile-add-to-cart-button/) · [Cleancommit: mobile bottom sticky ATC](https://cleancommit.io/ab-tests/mobile-bottom-sticky-add-to-cart-button/) · [BelVG: sticky add to cart](https://audit.belvg.com/guides/sticky-add-to-cart.html)
- [Material: bidirectionality](https://m2.material.io/go/design-bidirectionality) · [Wikimedia Codex: bidirectionality](https://doc.wikimedia.org/codex/main/style-guide/bidirectionality.html) · [Workday: RTL and Bidi](https://design.workday.com/globalization/rtl-and-bidi) · [Mozilla: RTL guidelines](https://firefox-source-docs.mozilla.org/_sources/code-quality/coding-style/rtl_guidelines.rst.txt) · [Tenten: RTL trên Shopify](https://tenten.co/shopify/rtl-design-shopify/) · [Marmeto: RTL Shopify cho GCC](https://marmeto.com/blogs/e-commerce/building-rtl-ready-shopify-stores-for-the-gcc)
- [Dimitri's Coffee](https://dimitriscoffee.com) · [Sprudge: Amman coffee guide](https://sprudge.com/amman-jordan-the-sprudge-coffee-guide-142523.html) · [Colorlib: coffee websites 2026](https://colorlib.com/wp/coffee-shop-websites/) · [WebCitz: coffee websites 2026](https://www.webcitz.com/blog/best-coffee-websites/) · [ecomm.design: Coffee Collective](https://ecomm.design/site/coffee-collective/)
