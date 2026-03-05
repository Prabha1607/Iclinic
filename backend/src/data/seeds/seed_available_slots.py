from sqlalchemy import text
from src.data.clients.postgres_client import AsyncSessionLocal


async def seed_available_slots():
    async with AsyncSessionLocal() as session:

        await session.execute(
            text("""
            INSERT INTO available_slots
            (provider_id, availability_date, start_time, end_time, notes)
            VALUES

            -- Dr. Arjun Kumar
            (1,'2026-03-04','09:00','09:30','Morning slot'),
            (1,'2026-03-04','09:30','10:00','Morning slot'),
            (1,'2026-03-04','10:00','10:30','Morning slot'),
            (1,'2026-03-05','09:00','09:30','Morning slot'),
            (1,'2026-03-05','09:30','10:00','Morning slot'),
            (1,'2026-03-06','14:00','14:30','Afternoon slot'),
            (1,'2026-03-06','14:30','15:00','Afternoon slot'),
            (1,'2026-03-07','10:00','10:30','Morning slot'),
            (1,'2026-03-07','10:30','11:00','Morning slot'),

            -- Dr. Meena Ravi
            (2,'2026-03-04','16:00','16:30','Evening slot'),
            (2,'2026-03-04','16:30','17:00','Evening slot'),
            (2,'2026-03-05','10:00','10:30','Heart checkup'),
            (2,'2026-03-05','10:30','11:00','Heart checkup'),
            (2,'2026-03-06','11:00','11:30','Heart checkup'),
            (2,'2026-03-06','11:30','12:00','Heart checkup'),

            -- Dr. Rahul Sharma
            (3,'2026-03-04','15:00','15:30','Vaccination slot'),
            (3,'2026-03-04','15:30','16:00','Vaccination slot'),
            (3,'2026-03-05','09:00','09:30','Kids clinic'),
            (3,'2026-03-05','09:30','10:00','Kids clinic'),
            (3,'2026-03-06','11:00','11:30','Kids checkup'),
            (3,'2026-03-06','11:30','12:00','Kids checkup')

            ON CONFLICT DO NOTHING;
            """)
        )

        await session.commit()



        