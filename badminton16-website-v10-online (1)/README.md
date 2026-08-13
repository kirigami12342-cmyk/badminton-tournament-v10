# Giải Cầu Lông CLB Kiến Trúc Việt — v10 Online Sync

Bản v10 chuyển dữ liệu giải từ lưu cục bộ trên từng trình duyệt sang dữ liệu dùng chung online bằng Netlify Functions + Netlify Blobs.

## Quan trọng để giữ dữ liệu bạn đã chỉnh ở bản v9

1. Deploy v10 vào **đúng project Netlify hiện tại** (cùng domain đang dùng).
2. Sau khi Netlify báo Published, mở website bằng **đúng Chrome/máy đã từng chỉnh và lưu dữ liệu ở v9**.
3. Không xóa cookies/site data/localStorage trước khi mở v10 lần đầu.
4. V10 sẽ đọc các key localStorage cũ (`ktv_badmiton_teams_v1`, `ktv_badminton_bracket_slots_v1`, `ktv_badminton_pair_lock_v1`).
5. Nếu tìm thấy dữ liệu đã chỉnh và kho online chưa có dữ liệu, v10 tự đưa dữ liệu đó lên Netlify Blobs.
6. Sau đó người khác mở cùng link sẽ đọc cùng dữ liệu online.

## Đồng bộ

- Tên đội, thành viên: đồng bộ online.
- Các vị trí Nhánh A/B, bán kết, chung kết, vô địch và ghi chú/kết quả: đồng bộ online.
- Trạng thái nút khóa cặp: đồng bộ online.
- Lịch sử bốc thăm và trạng thái còn lại của vòng quay: từ v10 trở đi được lưu online.
- Website kiểm tra dữ liệu mới khoảng mỗi 8 giây.

## Deploy bằng Netlify Drop

Kéo file ZIP v10 vào phần **Production deploys** của đúng project Netlify hiện tại. Bản này có `package.json` và `netlify.toml`; khi bạn đang đăng nhập, Netlify sẽ build project và deploy Functions cùng site.

## Cấu trúc

- `public/` — giao diện website
- `netlify/functions/state.mjs` — API đọc/ghi dữ liệu chung
- `netlify.toml` — cấu hình publish + Functions + `/api/state`
- `package.json` — dependency `@netlify/blobs`
