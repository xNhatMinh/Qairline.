const search = document.querySelector(".search-bar input"); // Lấy input search
const table_rows = document.querySelectorAll("tbody tr"); // Lấy tất cả các hàng trong tbody

search.addEventListener("input", searchTable);

function searchTable() {
  const search_data = search.value.toLowerCase();

  table_rows.forEach((row, i) => {
    // Gộp nội dung toàn bộ các ô của hàng thành một chuỗi
    const table_data = row.textContent.toLowerCase();

    // Ẩn hoặc hiện hàng dựa trên việc tìm thấy chuỗi tìm kiếm
    row.classList.toggle("hide", table_data.indexOf(search_data) < 0);

    // Thêm hiệu ứng trễ cho từng hàng
    row.style.setProperty("--delay", i / 25 + "s");
  });

  // Đổi màu nền cho các hàng hiển thị (zebra striping)
  applyZebrastripe();
}

function applyZebrastripe() {
  document.querySelectorAll("tbody tr:not(.hide)").forEach((visible_row, i) => {
    visible_row.style.backgroundColor =
      i % 2 === 0 ? "transparent" : "#00000019";
  });
}

applyZebrastripe();
