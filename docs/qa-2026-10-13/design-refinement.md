# Hoàn thiện thiết kế Azouz, 13/10/2026

Đã áp dụng `design-taste-frontend` và hướng dẫn brand của `impeccable` trên theme local. Thay đổi tập trung vào trang chủ và header; chưa tải lên Shopify.

## Đánh giá trước chỉnh sửa

Giữ nhận diện: Baloo Bhaijaan 2, logo Azouz, Mist/Graphite/Sage Light, ảnh hiện có và label block lấy từ bao bì. Giữ cấu trúc nội dung B2B trước, D2C sau, toàn bộ URL và nội dung đã cung cấp. Không thay metadata hoặc structured data.

Cảm giác sketch đến từ sự lặp lại: heading chữ hoa có rule dài, các hàng ảnh cùng kích thước có vạch dọc/ngang bao quanh, cùng một nhịp ở dịch vụ và sản phẩm. Header hai hàng nặng trên desktop rộng; bộ ba sản phẩm bị đặt trong grid bốn cột, để trống một phần hàng.

Chọn chế độ redesign giữ nhận diện. Các mức của skill: DESIGN_VARIANCE 5, MOTION_INTENSITY 3, VISUAL_DENSITY 4. Ưu tiên bố cục và hình ảnh; giữ theme màu sáng hiện có, không thêm font hoặc framework.

## Thay đổi

- Hero tràn chiều ngang, heading hai dòng ở desktop lớn và CTA chính màu sáng, dễ phân biệt trên ảnh tối. Giữ scrim tương phản cố định. Onyx trên Mist đạt khoảng 16.7:1 theo token hiện có.
- Header một hàng từ 1280px, cao 81px thay vì 142px. Dưới đó giữ bố cục thích ứng và menu details.
- Private Label trở thành khối dịch vụ chính: ảnh lớn bên cạnh nội dung trên desktop, ba dịch vụ còn lại nằm dưới. Loại vạch chia ô khỏi nhóm này; dùng khoảng trắng và tỷ lệ ảnh để phân cấp.
- Heading trang chủ trở về kiểu chữ thường, tăng kích thước và bỏ rule dài. Label bao bì vẫn giữ chữ hoa.
- Sản phẩm dùng grid tự khớp số cột, ảnh vuông chứa toàn bộ sản phẩm. Mist Alt tạo sự phân biệt cho cả section, không kẻ ô cho từng card.
- Story dùng ảnh ngang thay ảnh đứng kéo dài. Nhóm khách hàng dùng hai cột, đường chia nhẹ giữa các mục. Marquee giữ nút dừng và chỉ dùng viền mảnh.
- Hover ảnh dịch vụ chỉ scale nhẹ khi trỏ vào link; tắt transition khi người dùng yêu cầu reduced motion.

## Kiểm chứng

| Viewport | Chiều rộng document | Header | Đáy CTA hero |
| --- | --- | --- | --- |
| 320 × 740 | 305px | 98px | 716px |
| 768 × 900 | 753px | 98px | 819px |
| 1024 × 800 | 1009px | 142px | 749px |
| 1280 × 800 | 1265px | 81px | 736px |
| 1440 × 900 | 1425px | 81px | 768px |

15px chênh lệch là scrollbar. Không tràn ngang, không ảnh lỗi ở các kích thước đã kiểm tra. Desktop menu giữ một hàng. Tablet 768px: mục dịch vụ cuối dùng cả hàng với hai cột khoảng 330px, không bỏ trống nửa hàng. Không có console error khi kiểm tra trang chủ.

`npm test`: 790/790 đạt sau lần chỉnh cuối. `npm run validate`: đạt. Kiểm tra browser xác minh hình ảnh và bố cục; chưa phải đo Core Web Vitals hoặc kiểm tra giao dịch trên storefront thật.

## Bằng chứng

- [Trước, desktop](design-before-desktop.jpg)
- [Sau, hero desktop](design-after-hero.jpg)
- [Sau, dịch vụ desktop](design-after-services.jpg)
- [Sau, toàn trang desktop](design-after-desktop.jpg)
- [Sau, toàn trang mobile](design-after-mobile.jpg)
- [Số đo responsive](design-responsive-measurements.json)
- [Log test](design-refinement-tests.log)

Các sửa đổi có sẵn trong workspace được giữ lại. Preview tại http://localhost:4321/ hiển thị bản mới.
