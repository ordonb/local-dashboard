# Incorta Security Dashboard

The dashboard currently reads its data only from `data/incorta_vm_mock.xlsx`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. The dashboard reads the workbook's first sheet. It accepts common header variations for customer name, value, KPI code/stats, and the optional score column.
