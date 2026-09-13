FROM python:3.11-slim
WORKDIR /app
COPY services/ai/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY services/ai/app.py ./app.py
COPY ai ./ai
ENV FAYMOOS_AI_ARTIFACTS=/app/ai/artifacts
EXPOSE 8020
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8020"]
