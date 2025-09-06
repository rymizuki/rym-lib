import { PrismaClient } from '@prisma/client'

// Prismaの$transactionのネスト動作をテストするスクリプト

async function testNestedTransaction() {
  const prisma = new PrismaClient()
  
  console.log('=== Prismaの$transactionネストテスト ===\n')
  
  // テスト1: 通常のトランザクション内で$transactionプロパティが存在するか確認
  console.log('テスト1: トランザクション内での$transactionプロパティの存在確認')
  try {
    await prisma.$transaction(async (tx) => {
      console.log('外側のトランザクション開始')
      console.log('tx.$transactionの存在:', '$transaction' in tx)
      console.log('tx.$transactionの型:', typeof (tx as any).$transaction)
      
      // テスト2: ネストされたトランザクションを試みる
      if ('$transaction' in tx) {
        console.log('\nテスト2: ネストされたトランザクションを実行')
        try {
          await (tx as any).$transaction(async (nestedTx: any) => {
            console.log('内側のトランザクション実行')
          })
          console.log('ネストされたトランザクション成功')
        } catch (error) {
          console.log('ネストされたトランザクションエラー:', error)
        }
      } else {
        console.log('\n$transactionプロパティが存在しないため、ネストは不可能')
      }
    })
  } catch (error) {
    console.log('エラー:', error)
  }
  
  // テスト3: 実際のデータ操作でのネスト動作確認（擬似的）
  console.log('\n\nテスト3: 実際のデータ操作を伴うトランザクション')
  try {
    const result = await prisma.$transaction(async (tx) => {
      console.log('外側のトランザクション: データ操作開始')
      
      // ここで内部的にトランザクションを使いたい関数を呼び出す
      // 例: await someServiceThatUsesTransaction(tx)
      
      // txオブジェクトの利用可能なメソッドを確認
      console.log('利用可能なPrismaメソッドの例:')
      console.log('- tx.user が存在:', 'user' in tx)
      console.log('- tx.$queryRaw が存在:', '$queryRaw' in tx)
      console.log('- tx.$executeRaw が存在:', '$executeRaw' in tx)
      
      return 'トランザクション完了'
    })
    console.log('結果:', result)
  } catch (error) {
    console.log('エラー:', error)
  }
  
  await prisma.$disconnect()
}

// 実行
testNestedTransaction().catch(console.error)