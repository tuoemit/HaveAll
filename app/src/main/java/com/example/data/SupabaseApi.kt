package com.example.data

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

// Models matching Supabase tables
data class SupabaseConfig(
    val id: Long = 0,
    val type: String = "vmess",
    val raw_content: String = "",
    val remarks: String? = null,
    val created_at: String = ""
)

data class SupabaseProxy(
    val id: Long = 0,
    val server: String = "",
    val port: Int = 0,
    val secret: String = "",
    val tg_link: String = "",
    val created_at: String = ""
)

interface SupabaseApi {
    @GET("rest/v1/configs")
    suspend fun getConfigs(
        @Header("apikey") apiKey: String,
        @Header("Authorization") authHeader: String,
        @Query("select") select: String = "*",
        @Query("limit") limit: Int,
        @Query("offset") offset: Int,
        @Query("order") order: String = "created_at.desc"
    ): List<SupabaseConfig>

    @GET("rest/v1/proxies")
    suspend fun getProxies(
        @Header("apikey") apiKey: String,
        @Header("Authorization") authHeader: String,
        @Query("select") select: String = "*",
        @Query("limit") limit: Int,
        @Query("offset") offset: Int,
        @Query("order") order: String = "created_at.desc"
    ): List<SupabaseProxy>
}

object RetrofitClient {
    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    fun createService(baseUrl: String): SupabaseApi {
        // Safe check for valid URL ending with '/'
        val formattedUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"

        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl(formattedUrl)
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(SupabaseApi::class.java)
    }
}
