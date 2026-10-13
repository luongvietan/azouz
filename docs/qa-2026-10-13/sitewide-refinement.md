# Nâng cấp UI toàn site, 13/10/2026

Tiếp nối lượt tinh chỉnh trang chủ cùng ngày, áp dụng `design-taste-frontend` cho các trang dịch vụ, thương hiệu và shop. Chỉ chạy trên local preview, chưa tải lên Shopify.

Hướng thiết kế: redesign giữ nhận diện cho site B2B rang xay, ngôn ngữ Swiss-minimal theo bao bì. Mức DESIGN_VARIANCE 5, MOTION_INTENSITY 3, VISUAL_DENSITY 4, giữ như lượt trang chủ. Giữ nguyên font Baloo, màu, logo, URL, nhãn menu, nội dung và tên trường form. Theme vẫn chỉ có chế độ sáng theo quy tắc Three Surfaces trong DESIGN.md.

## Lỗi tìm thấy và cách sửa

| Trang | Trước | Sau |
| --- | --- | --- |
| Private Label | 5 bước trong grid 4 cột: 4 thẻ có viền và 1 thẻ lẻ hàng | 5 bước trên một hàng, mỗi bước có vạch mực phía trên, bỏ thẻ |
| Private Label | "Packaging Options": 4 ô xếp dọc thành một cột hẹp | 4 ô cùng hàng, căn giữa (2×2 trên mobile) |
| Wholesale | "Consistent Coffee": 3 ô + 1 ô lẻ, chữ trong ô bị xuống dòng | 4 ô cùng hàng, căn giữa |
| Chi nhánh | "What You Open With": 5 + 1 | 3 + 3 |
| Our Brands, Private Label | 8 mục: 5 + 3 | 4 + 4; mobile ghép 2 cột khi mục chỉ có tên |
| Shop | 3 sản phẩm trong grid 4 cột, thừa một cột trống, có vạch dọc | 3 cột đều nhau; label cùng chiều cao nên giá và độ rang thẳng hàng |
| Shop | Heading chữ in hoa kèm vạch kẻ dài | Chữ thường như trang chủ, không có vạch kẻ |
| Trang con | Ảnh hero nhỏ, nằm giữa cột; tiêu đề Wholesale dài 3 dòng | Ảnh lớn hơn, sát lề phải; tiêu đề tối đa 2 dòng |
| Trang chủ | "Our Story" dính sát dải marquee | Có khoảng cách bằng padding section |
| Sản phẩm | Cột mua hàng trôi khỏi màn hình khi cuộn ảnh | Cột mua hàng dính (sticky) từ 56em |
| Footer | Logo nằm một mình trên một hàng, để lại khoảng tối lớn | Logo và tagline thành cột đầu, footer ngắn hơn |
| Lựa chọn hai cột | Thẻ viền mảnh trên nền (ghost card) | Panel nền tông, không viền |

Nguyên nhân gốc của các ô đóng gói xếp dọc: `<reveal-on-scroll>` là custom element inline. Khi nằm trong grid căn giữa, nó co lại theo nội dung, nên grid auto-fit bên trong chỉ có chỗ cho một cột. Đã đặt `display: block` và cho wrapper giãn hết hàng.

Số cột của danh sách lấy từ snippet mới `snippets/grid-columns.liquid`. Có test kiểm tra với mọi số mục từ 2 đến 50 (giới hạn block của Shopify) rằng hàng cuối không bao giờ chỉ còn một mục.

## Kiểm chứng

- `npm test`: 794/794 đạt, gồm 790 test cũ và 4 test mới cho `grid-columns`. `npm run validate`: đạt. `git diff --check`: không lỗi whitespace.
- Không tràn ngang ở 320, 768, 1024 và 1440px trên 9 route: trang chủ, Private Label, Wholesale, Our Brands, chi nhánh, Request a Sample, Shop, sản phẩm, Search.
- Ảnh được chụp với `prefers-reduced-motion: reduce` để hiệu ứng reveal không làm trống section trong ảnh full-page.
- Chưa đo Core Web Vitals và chưa kiểm tra trên storefront Shopify thật.

## Bằng chứng

Trước / sau, desktop 1440px:
[Private Label](sitewide-before-pl.jpg) → [sau](sitewide-after-pl.jpg) ·
[Wholesale](sitewide-before-wh.jpg) → [sau](sitewide-after-wh.jpg) ·
[Shop](sitewide-before-shop.jpg) → [sau](sitewide-after-shop.jpg) ·
[Chi nhánh](sitewide-before-branch.jpg) → [sau](sitewide-after-branch.jpg) ·
[Our Brands](sitewide-before-brands.jpg) → [sau](sitewide-after-brands.jpg)

[Private Label mobile](sitewide-after-mobile-pl.jpg) · [Cột mua hàng sticky](sitewide-after-product-sticky.jpg) · [Log test](sitewide-tests.log)
