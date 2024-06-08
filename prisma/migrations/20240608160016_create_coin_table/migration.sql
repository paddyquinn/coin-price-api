-- CreateTable
CREATE TABLE "Coin" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(20,10) NOT NULL,

    CONSTRAINT "Coin_pkey" PRIMARY KEY ("id")
);
