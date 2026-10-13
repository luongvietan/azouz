# Đánh giá và cải thiện cấu trúc UI, 13/10/2026

Phạm vi: theme trong workspace và local preview. Chưa tải các thay đổi của lượt này lên Shopify. Giữ nguyên các chỉnh sửa có sẵn và nhận diện Azouz.

## Đánh giá cấu trúc

Trang chủ có thứ tự phù hợp với mục tiêu B2B: định vị roastery và yêu cầu mẫu, bốn hướng dịch vụ, sản phẩm bán lẻ, câu chuyện sản xuất, lời mời thử mẫu, nhóm khách hàng và CTA cuối trang. Hệ font Baloo, màu Mist/Graphite/Sage Light, ảnh bao bì và các đường phân cột đã nhất quán. Desktop 896px và 1024px giữ menu năm mục trên một hàng.

Các điểm cần sửa nằm ở điều hướng mobile và đường tới form, không cần thay toàn bộ bố cục. Ảnh lớn trên trang enquiry khiến form nằm khá sâu; thêm lối đi trực tiếp giữ được hình ảnh mà giảm thao tác cuộn.

## Đã sửa

- Logo mobile bị trừ thêm 120px dù grid đã dành chỗ cho các nút. Trước sửa: rộng 32px ở 375px và biến mất ở 320px. Sau sửa: khoảng 70.4 × 57px ở 320px, đúng tỷ lệ lockup và mức tối thiểu của thương hiệu.
- Menu mobile có dấu gạch dưới và `aria-current="page"` cho trang hiện tại, bao gồm mục con. Test render xác minh trạng thái cho cả desktop lẫn mobile. Preview fixtures hiện đặt mọi link `active: false`, nên trạng thái này được kiểm chứng bằng test render, chưa bằng storefront thật.
- Menu mobile giới hạn chiều cao theo viewport và cuộn độc lập. Ở 375 × 600px, panel kết thúc tại y=599.1px, cao 462px với nội dung 609px; cuộn tới nút Request a Sample được.
- Trang Request a Sample và Get a Quote có nút đi tới `#contact`. Đích có thể nhận focus, đồng thời khớp fragment redirect của contact form. Desktop có scroll margin để heading không bị sticky header che; mobile dùng vị trí tự nhiên.
- Token chiều cao header trước đây vẫn đổi ở 48em và dành tới 264px trên tablet, trong khi header thực đổi ở 56em. Đã đồng bộ thành 137px cho mobile và 181px từ 56em, khớp header mặc định và các thay đổi logo. Token là mức dự phòng cho cấu hình mặc định; menu hoặc announcement dài hơn vẫn cần đo lại.

## Kiểm chứng

- Browser: trang chủ, Private Label, sản phẩm Espresso Arabica Beans, Request a Sample và Get a Quote; các viewport 320px, 375px, 896px, 1024px và desktop mặc định.
- 320px: document rộng 305px sau khi trừ scrollbar, không tràn ngang; logo hiển thị.
- Nút enquiry cập nhật hash và chuyển focus tới `contact`. 1024px: heading form ở y=230.1px, phía dưới sticky header kết thúc ở y=142px.
- `npm test`: 790/790 đạt; `npm run validate`: đạt; `git diff --check`: không có lỗi whitespace.
- Chưa gửi enquiry hoặc kiểm tra thanh toán thật trong lượt này. Đây là kiểm tra UI của local preview, không phải xác nhận vận hành Shopify production.

Ảnh: [mobile](ui-sample-mobile-improved.jpg), [anchor báo giá desktop](ui-quote-anchor-desktop.jpg). Log: [tests](ui-improvements-tests.log).
