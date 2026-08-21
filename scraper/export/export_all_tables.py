import mariadb
import pandas as pd
import os

def export_all_tables():
    conn = mariadb.connect(
        user=os.getenv("DB_USER", "scraper_user"),
        password=os.getenv("DB_PASSWORD", "your_strong_password"),
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME", "cryptoviz")
    )
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES;")
    tables = [row[0] for row in cursor.fetchall()]
    with pd.ExcelWriter("export/all_tables.xlsx") as writer:
        for table in tables:
            df = pd.read_sql(f"SELECT * FROM {table}", conn)
            df.to_excel(writer, sheet_name=table, index=False)
    conn.close()
    print(f"Exporté: {len(tables)} tables dans export/export.xlsx")

if __name__ == "__main__":
    export_all_tables()
