# Kiểm tra UI/UX Azouz — 13/10/2026

**Cập nhật sau sửa:** đã triển khai và kiểm chứng bản sửa giỏ hàng và Wholesale trên theme live. Checkout tạm để lại theo yêu cầu người dùng vì tài khoản hiện tại thiếu quyền Payments. Chi tiết: [kết quả sửa](fixes.md). Phần bên dưới là kết quả kiểm tra ban đầu, trước khi sửa.

Kiểm tra trên storefront đang chạy và bản theme `azouz/main` (188752036161) vừa tải từ Shopify. **Chưa đạt điều kiện chốt toàn bộ UI/UX: có 3 lỗi cần xử lý.** Không sửa hoặc triển khai theme trong lượt kiểm tra này.

## Lỗi cần ưu tiên

| Mức | Phát hiện | Tác động / hướng xử lý |
| --- | --- | --- |
| P0 — chặn bán hàng | Checkout hiện “This store can’t accept payments right now.”, nút Pay now bị vô hiệu hóa. | Thiết lập phương thức thanh toán trong Shopify rồi kiểm thử lại bằng chế độ test. Đây là cấu hình cửa hàng; thay CSS không giải quyết được. |
| P1 | Sau Add to cart, cả drawer và trang cart không hiện tên, ảnh hoặc mô tả biến thể sản phẩm. Liên kết sản phẩm không có tên truy cập; nút Remove chỉ đọc là “Remove”. | Khách không biết chính xác sản phẩm trong giỏ. `snippets/cart-line-items.liquid` dùng `item.product_title` và `item.variant_title`, trong khi Liquid line_item cung cấp `product`, `variant`, `title`. Dùng thuộc tính Liquid phù hợp, bổ sung fallback ảnh, rồi kiểm tra bằng cart thật thay vì chỉ fixture local. |
| P2 | Trang Wholesale tràn ngang tại nhóm “Consistent Coffee, Batch After Batch.” ở viewport 320 px. Chiều rộng tài liệu đo được 357 px; tiêu đề, mô tả và ô Wholesale Bags bị cắt. | Sửa khả năng co của grid trong `.packaging-sizes__inner` và các phần tử con. Kiểm tra lại ở 320, 360, 375 px. |

Ảnh bằng chứng: [checkout](checkout-payments-disabled.jpg), [cart drawer](cart-drawer-missing-title.jpg), [cart page](cart-page-missing-title.jpg), [Wholesale 320 px](wholesale-320-overflow.jpg).

## Phạm vi mobile

Kiểm tra 17 trang đang được liên kết từ storefront ở 375 × 812 và 320 × 740 px:

- Trang chủ.
- Private Label, Wholesale, Own an Azouz Coffee, Sample, Quote.
- Shop /collections/all, Search, Cart.
- Ba sản phẩm: Espresso Arabica Beans, Filter Coffee Can, Turkish Coffee.
- Privacy, Refund, Shipping, Contact information, Terms of service.

Ở 375 px, các trang được kiểm tra không làm tài liệu tràn ngang. Ở 320 px, phát hiện lỗi Wholesale kể trên. Dải marquee có nội dung dài nằm trong vùng cắt có chủ ý; honeypot của form nằm trong vùng 1 px được ẩn. Hai trường hợp đó không được tính là lỗi tràn giao diện.

Menu mobile mở được bằng thao tác chạm và Enter; Tab đi vào liên kết Private Label; Enter chuyển đúng trang. Menu có 4 mục và không có Our Brands. Các nút chính, số lượng sản phẩm và trường form được đo đạt chiều cao 44–49 px; textarea lớn hơn. Footer link và link trong nội dung chưa được chứng nhận toàn bộ theo tiêu chí target spacing của WCAG.

## Form thật

Đã dùng email thử nghiệm do người dùng cung cấp, tên bắt đầu bằng **QA TEST**, lời nhắn yêu cầu bỏ qua hồ sơ và không chuẩn bị/gửi sample hay thực hiện giao dịch.

| Form | Kết quả |
| --- | --- |
| Quote | Chặn tên bỏ trống; email sai có `typeMismatch=true`; volume bắt buộc. Shopify trả `contact_posted=true` và thông báo thành công. |
| Sample | Chặn tên bỏ trống; volume là tùy chọn. Shopify trả `contact_posted=true` và thông báo thành công. |
| Mở chi nhánh | Chặn tên bỏ trống; nút hero tới `#enquire`, form nằm dưới header đúng khoảng cách (đỉnh anchor 124 px, header 85 px ở 320 px). Lần đầu hiện hCaptcha tương tác, chưa gửi thành công; không giải CAPTCHA. Lần thử lại được Shopify chấp nhận và hiển thị thông báo thành công. |

Thông báo cả ba: “Thanks. We have your enquiry and will be in touch shortly.” Ảnh: [Quote](quote-success.jpg), [Sample](sample-success.jpg), [chi nhánh](branch-success.jpg).

Đây là xác nhận **Shopify đã nhận POST**, chưa phải xác nhận email đã đến hộp thư người nhận của cửa hàng. Chưa truy cập hộp thư nhận thông báo để xác minh delivery. Chưa thử gửi lại bằng nút phụ Request More Information để tránh tạo thêm hồ sơ ngoài ba hồ sơ đã cho phép.

Đề xuất bổ sung trường Request type / Source cho Sample và Quote để người nhận phân biệt rõ hai loại yêu cầu trong email.

## Mua hàng

Đã kiểm tra cả ba trang sản phẩm, thêm Turkish Coffee bằng Enter, tăng/giảm số lượng, mở drawer, vào cart, cập nhật lượng từ 1 lên 2 và tới checkout.

- Đơn giá 2.800 JD; 2 sản phẩm có subtotal 5.600 JD.
- Checkout hiển thị đúng tên, ảnh, biến thể 200g / Ground và lượng 2, dù cart của theme bị thiếu thông tin.
- Checkout hiện hai lựa chọn vận chuyển: Amman 3.000 JD và Outside Amman 5.000 JD.
- Với Amman: thuế dự tính 0.896 JD, tổng 9.496 JD.
- Thanh toán bị chặn bởi cấu hình cửa hàng. Không đặt hàng, không nhập thông tin thanh toán.
- Đã xóa các sản phẩm thử nghiệm; giỏ hàng trở về 0.
- Sắp xếp Price, low to high chuyển tới `sort_by=price-ascending` và trả thứ tự Turkish → Filter → Espresso, khớp giá 2.800 → 7.250 → 7.500 JD. Tìm kiếm espresso trả trang kết quả 3 sản phẩm; chưa đánh giá chất lượng xếp hạng tìm kiếm.

Cần kiểm tra lại điều kiện địa lý của hai phí shipping bằng địa chỉ được phép dùng trong lượt thử checkout sau. Hiện cả hai lựa chọn cùng xuất hiện khi quốc gia là Jordan.

## Tương phản và bàn phím

Đo màu tính toán của chữ trên nền đặc trong browser. Không coi nền ảnh như nền trắng: chữ hero/sample được đánh giá riêng bằng lớp scrim của CSS live.

- Chữ muted thường: 5.45:1; một số hint ở nền alt: thấp nhất 4.94:1.
- Nút chính: chữ trắng trên nền graphite, 10.25:1.
- Nhãn sản phẩm: Espresso 13.71:1, Filter 9.41:1, Turkish 10.31:1.
- Hero và sample dùng Onyx scrim 84%; phép tính bảo thủ trên nền ảnh trắng cho 4.83:1. Đây là kiểm tra thiết kế lớp phủ, không phải phép quét từng pixel của toàn bộ ảnh.
- Không phát hiện lỗi tương phản chữ thường ở các nền đặc đã đo. Không chứng nhận toàn bộ WCAG: placeholder, trạng thái hover/disabled, đồ họa và vùng ảnh chưa được quét toàn diện.
- Skip link đưa focus tới MainContent. Focus menu có outline solid 2 px. Tab và Enter điều hướng menu đúng. Escape đóng cart dialog và trả focus về Add to cart.
- Escape chưa đóng menu native details; Enter vẫn đóng/mở được. Có thể bổ sung Escape như cải thiện trải nghiệm, không coi đây là lỗi chặn.
- Đã quan sát Tab ngược trong dialog, nhưng chưa kết luận đầy đủ vòng focus vì Chrome có thể đưa focus sang chrome trình duyệt. Cần kiểm tra riêng với trình đọc màn hình và bàn phím trên thiết bị thật.

Ngưỡng đối chiếu: [W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Thuộc tính cart: [Shopify Liquid line_item](https://shopify.dev/docs/api/liquid/objects/line_item).

## Tải ảnh

Ảnh hero dùng eager + fetchpriority high; ảnh bên dưới dùng lazy. Có srcset, sizes và width/height. Browser chọn rendition 400 px cho hero và ảnh dịch vụ ở mobile.

Đo HTTP GET riêng từng URL CDN 400 px, với Accept hỗ trợ WebP, từ máy hiện tại; mỗi ảnh đo một lần:

| Ảnh | Dung lượng trả về | Tổng thời gian |
| --- | ---: | ---: |
| Roastery hero | 27,484 bytes | 0.682 s |
| Private Label | 17,492 bytes | 0.577 s |
| Wholesale | 29,776 bytes | 0.655 s |
| Specialty | 21,388 bytes | 0.604 s |

Cả bốn trả HTTP 200, `image/webp`; tổng payload khoảng 96 KB. Các thời gian này là tải riêng tài nguyên, không phải LCP hay tốc độ toàn trang, và không mô phỏng mạng di động chậm.

PageSpeed Insights API trả HTTP 429 do hết quota. Browser runtime không cung cấp Resource Timing cho phép đo này. **Chưa có số liệu LCP, INP, CLS hoặc điểm Lighthouse**, nên chưa thể chốt Core Web Vitals. Đối chiếu phương pháp: [Web Vitals](https://web.dev/articles/vitals).

## Bước tiếp theo

1. Bật/cấu hình thanh toán và thực hiện đơn test có địa chỉ được phép dùng.
2. Sửa tên, ảnh và biến thể trong cart bằng đối tượng Liquid thật.
3. Sửa grid Wholesale ở 320 px.
4. Xác nhận email nhận đủ ba hồ sơ QA, đo lại Core Web Vitals khi có công cụ/quota và kiểm tra thiết bị thật.

Dữ liệu DOM: [mobile-layouts.json](mobile-layouts.json). Bản theme live dùng để đối chiếu: `C:/Users/admin/AppData/Local/Temp/azouz-ux-audit-20261013`.
